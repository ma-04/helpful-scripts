<?php
/**
 * Plugin Name:       WP-CLI Redis Diagnostics
 * Description:       Adds a WP-CLI command `wp redis diagnose` to test and diagnose the Redis connection for WordPress.
 * Version:           1.1.0
 * Author:            T3 Chat
 * Author URI:        https://example.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       wp-cli-redis-diagnostics
 */

if (!defined('WPINC')) {
  die;
}

// Only load the command if WP-CLI is running
if (defined('WP_CLI') && WP_CLI) {
  /**
   * Manages and diagnoses the Redis connection for WordPress.
   */
  class Redis_Diagnose_CLI
  {
    /**
     * The Redis client instance.
     *
     * @var Redis|null
     */
    private $redis;

    /**
     * Connection status.
     *
     * @var bool
     */
    private $is_connected = false;

    /**
     * The Redis key prefix.
     *
     * @var string|null
     */
    private $prefix = null;

    public function __construct()
    {
      if (!class_exists('Redis')) {
        WP_CLI::error(
          'The PECL Redis extension is not installed or enabled. This plugin cannot function without it.'
        );
        return;
      }

      $this->redis = new Redis();
      $this->connect();
    }

    /**
     * Connects to the Redis server using WordPress configuration constants.
     */
    private function connect()
    {
      // Standard constants used by popular Redis object cache plugins
      $host = defined('WP_REDIS_HOST') ? WP_REDIS_HOST : '127.0.0.1';
      $port = defined('WP_REDIS_PORT') ? WP_REDIS_PORT : 6379;
      $database = defined('WP_REDIS_DATABASE') ? WP_REDIS_DATABASE : 0;
      $password = defined('WP_REDIS_PASSWORD') ? WP_REDIS_PASSWORD : null;
      $timeout = defined('WP_REDIS_TIMEOUT') ? WP_REDIS_TIMEOUT : 1;
      $retry_interval = defined('WP_REDIS_RETRY_INTERVAL')
        ? WP_REDIS_RETRY_INTERVAL
        : 100; // 100ms

      try {
        // Use @ to suppress warnings on connection failure, we'll handle it.
        if (@$this->redis->connect($host, $port, $timeout, null, $retry_interval)) {
          if ($password && !$this->redis->auth($password)) {
            WP_CLI::warning('Redis authentication failed.');
            return;
          }
          if ($database && !$this->redis->select($database)) {
            WP_CLI::warning("Could not select Redis database {$database}.");
            return;
          }
          $this->is_connected = true;

          // **NEW**: Set key prefix if defined
          if (defined('WP_REDIS_PREFIX')) {
            $this->prefix = WP_REDIS_PREFIX;
            $this->redis->setOption(Redis::OPT_PREFIX, $this->prefix);
          }
        }
      } catch (Exception $e) {
        // Connection failed, is_connected remains false.
        // We will report this in the status command.
      }
    }

    /**
     * Checks the overall status of the Redis connection and object cache.
     *
     * ## EXAMPLES
     *
     *     wp redis diagnose status
     *
     */
    public function status()
    {
      // 1. Check if an external object cache is in use
      if (function_exists('wp_using_ext_object_cache') && wp_using_ext_object_cache()) {
        WP_CLI::success('WordPress is configured to use an external object cache.');
      } else {
        WP_CLI::warning(
          'WordPress is NOT using an external object cache. Check your object-cache.php drop-in.'
        );
      }

      // 2. Check Redis PECL extension
      if (!class_exists('Redis')) {
        WP_CLI::error('The PECL Redis extension is not installed or enabled.');
        return;
      } else {
        WP_CLI::success('PECL Redis extension is loaded.');
      }

      // 3. Check connection
      if (!$this->is_connected) {
        $host = defined('WP_REDIS_HOST') ? WP_REDIS_HOST : '127.0.0.1';
        $port = defined('WP_REDIS_PORT') ? WP_REDIS_PORT : 6379;
        WP_CLI::error(
          "Failed to connect to Redis at {$host}:{$port}. Check your wp-config.php constants (e.g., WP_REDIS_HOST)."
        );
        return;
      }

      WP_CLI::success('Successfully connected to Redis.');

      // **NEW**: Report prefix usage
      if ($this->prefix) {
        WP_CLI::log("Using Redis prefix: '{$this->prefix}'");
      } else {
        WP_CLI::log('No WP_REDIS_PREFIX constant found or used.');
      }

      // 4. Ping for latency
      $this->ping([], [], false); // Run ping without the extra text

      // 5. Get some basic server info
      try {
        $info = $this->redis->info('server');
        $memory = $this->redis->info('memory');
        $stats = [
          ['key' => 'Redis Version', 'value' => $info['redis_version']],
          ['key' => 'Uptime (days)', 'value' => round($info['uptime_in_seconds'] / 86400, 2)],
          ['key' => 'Used Memory', 'value' => $memory['used_memory_human']],
          ['key' => 'Peak Memory', 'value' => $memory['used_memory_peak_human']],
        ];
        WP_CLI\Utils\format_items('table', $stats, ['key', 'value']);
      } catch (Exception $e) {
        WP_CLI::warning("Could not retrieve server info: " . $e->getMessage());
      }
    }

    /**
     * Pings the Redis server to check for connectivity and latency.
     *
     * ## EXAMPLES
     *
     *     wp redis diagnose ping
     *
     */
    public function ping($_, $_assoc_args, $verbose = true)
    {
      $this->check_connection();
      $start_time = microtime(true);
      try {
        $response = $this->redis->ping();
        $end_time = microtime(true);
        $latency = round(($end_time - $start_time) * 1000, 2);

        if ($response === '+PONG' || $response === true) {
          if ($verbose) {
            WP_CLI::success("PONG! Latency: {$latency} ms");
          } else {
            WP_CLI::log("Redis Ping: PONG! (Latency: {$latency} ms)");
          }
        } else {
          WP_CLI::warning("Received an unexpected response: " . print_r($response, true));
        }
      } catch (Exception $e) {
        WP_CLI::error("Ping failed: " . $e->getMessage());
      }
    }

    /**
     * Performs a basic SET, GET, and DEL test using the WP_REDIS_PREFIX.
     *
     * ## EXAMPLES
     *
     *     wp redis diagnose test
     *
     */
    public function test()
    {
      $this->check_connection();
      WP_CLI::log('Performing basic read/write test...');
      if ($this->prefix) {
        WP_CLI::log("Note: The test key will be automatically prefixed with '{$this->prefix}'.");
      }

      $key = 'wp_cli_redis_test:' . uniqid();
      $value = 'test_value_' . time();

      try {
        // Test SET
        WP_CLI::log("1. Setting key '{$key}'...");
        if ($this->redis->set($key, $value, 10)) {
          // Expire in 10s
          WP_CLI::success('SET command successful.');
        } else {
          WP_CLI::error('SET command failed.', false);
        }

        // Test GET
        WP_CLI::log("2. Getting key '{$key}'...");
        $retrieved_value = $this->redis->get($key);
        if ($retrieved_value === $value) {
          WP_CLI::success('GET command successful. Value matches.');
        } else {
          WP_CLI::error(
            "GET command failed. Expected '{$value}', got '{$retrieved_value}'.",
            false
          );
        }

        // Test DEL
        WP_CLI::log("3. Deleting key '{$key}'...");
        if ($this->redis->del($key) > 0) {
          WP_CLI::success('DEL command successful.');
        } else {
          WP_CLI::error('DEL command failed.', false);
        }
      } catch (Exception $e) {
        WP_CLI::error("An exception occurred during the test: " . $e->getMessage());
      }
    }

    /**
     * Retrieves information and statistics about the Redis server.
     *
     * ## OPTIONS
     *
     * [<section>]
     * : Optional. The section of information to retrieve (e.g., server, memory, stats, keyspace).
     *
     * ## EXAMPLES
     *
     *     # Get all info
     *     wp redis diagnose info
     *
     *     # Get memory info only
     *     wp redis diagnose info memory
     */
    public function info($args)
    {
      $this->check_connection();
      $section = isset($args[0]) ? $args[0] : null;

      try {
        $info = $section ? $this->redis->info($section) : $this->redis->info();
        $display_items = [];
        foreach ($info as $key => $value) {
          $display_items[] = ['key' => $key, 'value' => $value];
        }
        WP_CLI\Utils\format_items('table', $display_items, ['key', 'value']);
      } catch (Exception $e) {
        WP_CLI::error("Could not retrieve info: " . $e->getMessage());
      }
    }

    /**
     * Flushes the current Redis database.
     *
     * This command is destructive and will delete all keys in the current database.
     * It uses FLUSHDB, not FLUSHALL, to avoid clearing other databases on the same Redis instance.
     *
     * ## OPTIONS
     *
     * [--yes]
     * : Skip the confirmation prompt.
     *
     * ## EXAMPLES
     *
     *     wp redis diagnose flush --yes
     */
    public function flush($args, $assoc_args)
    {
      $this->check_connection();
      WP_CLI::confirm(
        'Are you sure you want to flush the current Redis database? This cannot be undone.',
        $assoc_args
      );

      try {
        if ($this->redis->flushDB()) {
          WP_CLI::success('Redis database flushed successfully.');
        } else {
          WP_CLI::error('Failed to flush Redis database.');
        }
      } catch (Exception $e) {
        WP_CLI::error("An exception occurred during flush: " . $e->getMessage());
      }
    }

    /**
     * Gets the value of a key from Redis.
     *
     * If WP_REDIS_PREFIX is defined, it will be automatically prepended to the key name.
     * Provide the key as WordPress would see it (e.g., "transient:my_transient_name").
     *
     * ## OPTIONS
     *
     * <key>
     * : The key to retrieve, without the global prefix.
     *
     * ## EXAMPLES
     *
     *     wp redis diagnose get "wp:transient:my_transient_name"
     */
    public function get($args)
    {
      $this->check_connection();
      $key = $args[0];
      $value = $this->redis->get($key);

      if ($value === false) {
        WP_CLI::warning("Key '{$key}' not found in Redis (with prefix '{$this->prefix}').");
      } else {
        WP_CLI::log($value);
      }
    }

    /**
     * Sets the value of a key in Redis.
     *
     * If WP_REDIS_PREFIX is defined, it will be automatically prepended to the key name.
     *
     * ## OPTIONS
     *
     * <key>
     * : The key to set, without the global prefix.
     *
     * <value>
     * : The value to set for the key.
     *
     * [--expire=<seconds>]
     * : Optional. Set an expiration time in seconds.
     *
     * ## EXAMPLES
     *
     *     wp redis diagnose set my_key my_value --expire=3600
     */
    public function set($args, $assoc_args)
    {
      $this->check_connection();
      $key = $args[0];
      $value = $args[1];
      $expire = isset($assoc_args['expire']) ? (int) $assoc_args['expire'] : 0;

      $options = [];
      if ($expire > 0) {
        $options['ex'] = $expire;
      }

      if ($this->redis->set($key, $value, $options)) {
        WP_CLI::success("Key '{$key}' set successfully (with prefix '{$this->prefix}').");
        if ($expire > 0) {
          WP_CLI::log("Expiration set to {$expire} seconds.");
        }
      } else {
        WP_CLI::error("Failed to set key '{$key}'.");
      }
    }

    public function decrby($args, $assoc_args)
    {
      $this->check_connection();

      // Validate arguments
      if (count($args) < 2) {
        WP_CLI::error('Usage: wp redis diagnose decrby <key> <decrement>');
        return;
      }

      $key = $args[0];
      $decrement = $args[1];

      // Ensure decrement value is an integer
      if (!ctype_digit((string) $decrement) && !($decrement[0] === '-' && ctype_digit(substr($decrement, 1)))) {
        WP_CLI::error('The <decrement> value must be an integer.');
        return;
      }
      $decrement = (int) $decrement;

      try {
        $newValue = $this->redis->decrBy($key, $decrement);

        if ($newValue === false) {
          // This can happen if the key holds a string which cannot be represented as an integer
          WP_CLI::error(
            "Failed to decrement key '{$key}'. It may not hold an integer value."
          );
        } else {
          WP_CLI::success(
            "Key '{$key}' decremented by {$decrement}. New value: {$newValue}"
          );
        }
      } catch (Exception $e) {
        WP_CLI::error(
          "An exception occurred during DECRBY: " . $e->getMessage()
        );
      }
    }
    /**
     * Helper to check for a valid connection and throw an error if not connected.
     */
    private function check_connection()
    {
      if (!$this->is_connected) {
        WP_CLI::error(
          'Not connected to Redis. Please check your configuration and server status.'
        );
      }
    }
  }

  WP_CLI::add_command('redis diagnose', 'Redis_Diagnose_CLI');
}
