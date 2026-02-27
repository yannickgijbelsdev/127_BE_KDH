<?php
/**
 * 127 Tools Theme Functions
 * 
 * Main functions file for the 127.be diagnostic tools platform
 * 
 * @package 127_Tools
 * @version 1.0.0
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Theme version
define('TOOLS_THEME_VERSION', '1.0.0');
define('TOOLS_THEME_DIR', get_template_directory());
define('TOOLS_THEME_URI', get_template_directory_uri());

/**
 * Theme Setup
 */
function tools_theme_setup() {
    // Add theme support
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('custom-logo');
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
    ));
    
    // Register navigation menus
    register_nav_menus(array(
        'primary' => __('Primary Menu', '127-tools'),
        'footer' => __('Footer Menu', '127-tools'),
    ));
    
    // Add support for editor styles
    add_editor_style();
}
add_action('after_setup_theme', 'tools_theme_setup');

/**
 * Enqueue Scripts and Styles
 */
function tools_enqueue_scripts() {
    // Main stylesheet
    wp_enqueue_style('127-tools-style', get_stylesheet_uri(), array(), TOOLS_THEME_VERSION);
    
    // Custom CSS
    wp_enqueue_style('127-tools-custom', TOOLS_THEME_URI . '/assets/css/custom.css', array(), TOOLS_THEME_VERSION);
    
    // Main JavaScript
    wp_enqueue_script('127-tools-main', TOOLS_THEME_URI . '/assets/js/main.js', array('jquery'), TOOLS_THEME_VERSION, true);
    
    // Localize script with PHP data
    wp_localize_script('127-tools-main', 'toolsData', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('tools-nonce'),
        'siteUrl' => home_url(),
    ));
}
add_action('wp_enqueue_scripts', 'tools_enqueue_scripts');

/**
 * Register Widget Areas
 */
function tools_widgets_init() {
    register_sidebar(array(
        'name'          => __('Sidebar', '127-tools'),
        'id'            => 'sidebar-1',
        'description'   => __('Add widgets here.', '127-tools'),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h2 class="widget-title">',
        'after_title'   => '</h2>',
    ));
    
    register_sidebar(array(
        'name'          => __('Footer', '127-tools'),
        'id'            => 'footer-1',
        'description'   => __('Add footer widgets here.', '127-tools'),
        'before_widget' => '<div id="%1$s" class="footer-widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h3 class="footer-widget-title">',
        'after_title'   => '</h3>',
    ));
}
add_action('widgets_init', 'tools_widgets_init');

/**
 * Custom Post Types
 */
require_once TOOLS_THEME_DIR . '/inc/custom-post-types.php';

/**
 * Admin Panel Integration
 */
require_once TOOLS_THEME_DIR . '/inc/admin-panel.php';

/**
 * Analytics Functions
 */
require_once TOOLS_THEME_DIR . '/inc/analytics.php';

/**
 * Tools Functions
 */
require_once TOOLS_THEME_DIR . '/inc/tools-functions.php';

/**
 * Database Functions
 */
require_once TOOLS_THEME_DIR . '/inc/database.php';

/**
 * AJAX Handlers
 */
require_once TOOLS_THEME_DIR . '/inc/ajax-handlers.php';

/**
 * Helper Functions
 */
require_once TOOLS_THEME_DIR . '/inc/helpers.php';

/**
 * Autosoft Integration
 */
require_once TOOLS_THEME_DIR . '/inc/autosoft.php';

/**
 * Pexels API Integration
 */
function tools_get_pexels_videos($query, $per_page = 10, $page = 1) {
    $api_key = defined('PEXELS_API_KEY') ? PEXELS_API_KEY : '';
    
    if (empty($api_key)) {
        return array('error' => 'Pexels API key not configured');
    }
    
    $response = wp_remote_get("https://api.pexels.com/videos/search?query={$query}&orientation=landscape&per_page={$per_page}&page={$page}", array(
        'headers' => array(
            'Authorization' => $api_key
        ),
        'timeout' => 10
    ));
    
    if (is_wp_error($response)) {
        return array('error' => $response->get_error_message());
    }
    
    return json_decode(wp_remote_retrieve_body($response), true);
}

function tools_get_pexels_photos($query, $per_page = 15, $page = 1) {
    $api_key = defined('PEXELS_API_KEY') ? PEXELS_API_KEY : '';
    
    if (empty($api_key)) {
        return array('error' => 'Pexels API key not configured');
    }
    
    $response = wp_remote_get("https://api.pexels.com/v1/search?query={$query}&orientation=landscape&per_page={$per_page}&page={$page}", array(
        'headers' => array(
            'Authorization' => $api_key
        ),
        'timeout' => 10
    ));
    
    if (is_wp_error($response)) {
        return array('error' => $response->get_error_message());
    }
    
    return json_decode(wp_remote_retrieve_body($response), true);
}

/**
 * Add Custom Page Templates
 */
function tools_add_page_templates($templates) {
    $templates['page-templates/template-dead-pixel.php'] = 'Dead Pixel Detector';
    $templates['page-templates/template-printer.php'] = 'Printer Tester';
    $templates['page-templates/template-screen.php'] = 'Screen Refresh Tester';
    $templates['page-templates/template-webcam.php'] = 'Webcam & Audio Test';
    $templates['page-templates/template-password.php'] = 'Password Generator';
    $templates['page-templates/template-admin-dashboard.php'] = 'Admin Dashboard';
    $templates['page-templates/template-autosoft.php'] = 'Autosoft Device Management';
    return $templates;
}
add_filter('theme_page_templates', 'tools_add_page_templates');

/**
 * Security: Remove WordPress Version
 */
remove_action('wp_head', 'wp_generator');

/**
 * Optimize WordPress
 */
add_filter('xmlrpc_enabled', '__return_false');
