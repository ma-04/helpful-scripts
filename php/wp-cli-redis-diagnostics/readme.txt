=== WP-CLI Redis Diagnostics ===
Contributors: T3 Chat
Tags: cli, wp-cli, redis, debug, performance, cache
Requires at least: 5.0
Tested up to: 6.5
Stable tag: 1.2.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Adds a WP-CLI command `wp redis diagnose` to test and diagnose the Redis connection for WordPress.

== Description ==

This plugin provides a suite of WP-CLI commands to help developers and system administrators diagnose and interact with the Redis server used by their WordPress installation.

It automatically detects connection settings from common `wp-config.php` constants (`WP_REDIS_HOST`, `WP_REDIS_PORT`, `WP_REDIS_PREFIX`, etc.) and provides clear, actionable feedback.

**Features:**

*   Comprehensive status check (`status`).
*   Latency test (`ping`).
*   Read/Write/Delete functionality test (`test`).
*   View server information (`info`).
*   Safely flush the current Redis database (`flush`).
*   Directly get/set keys for debugging (`get`, `set`), automatically using your `WP_REDIS_PREFIX`.
*   Increment/Decrement atomic counters (`incrby`, `decrby`).

== Installation ==

1.  **Prerequisite:** You must have the [PECL Redis PHP extension](https://pecl.php.net/package/redis) installed and enabled on your server.
2.  Place the `wp-cli-redis-diagnostics` folder in your `/wp-content/plugins/` directory.
3.  Activate the plugin through the 'Plugins' menu in WordPress or by running `wp plugin activate wp-cli-redis-diagnostics`.
4.  The `wp redis diagnose` command will now be available in WP-CLI.

== Usage ==

All commands are run from your terminal via WP-CLI.

**Check overall status:**
`wp redis diagnose status`

**Get a specific key (e.g., a transient):**
`wp redis diagnose get "wp:transient:my_transient"`

**Set a key and then decrement its value:**
`wp redis diagnose set my_counter 100`
`wp redis diagnose decrby my_counter 10`

**Flush the current Redis database (use with caution):**
`wp redis diagnose flush --yes`

== Changelog ==

= 1.2.0 =
*   Feature: Added `decrby` command to decrement the integer value of a key.
*   Enhancement: Improved integer validation for decrement value.

= 1.1.0 =
*   Feature: Automatically detect and use the `WP_REDIS_PREFIX` constant from `wp-config.php`.
*   Enhancement: The `status` command now reports the active Redis prefix.
*   Enhancement: The `get`, `set`, and `test` commands now transparently use the prefix for a more accurate simulation of WordPress behavior.
*   Enhancement: Updated command documentation to clarify prefix handling.

= 1.0.0 =
*   Initial release.
