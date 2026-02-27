<?php
/**
 * AJAX Handlers
 */

if (!defined('ABSPATH')) exit;

// Analytics Event
add_action('wp_ajax_tools_track_event', 'tools_ajax_track_event');
add_action('wp_ajax_nopriv_tools_track_event', 'tools_ajax_track_event');

function tools_ajax_track_event() {
    check_ajax_referer('tools-nonce', 'nonce');
    
    $tool_id = sanitize_text_field($_POST['tool_id'] ?? '');
    $tool_name = sanitize_text_field($_POST['tool_name'] ?? '');
    $event_type = sanitize_text_field($_POST['event_type'] ?? '');
    $event_data = isset($_POST['event_data']) ? $_POST['event_data'] : array();
    
    tools_insert_analytics($tool_id, $tool_name, $event_type, $event_data);
    
    wp_send_json_success(array('message' => 'Event tracked'));
}

// Submit Feedback
add_action('wp_ajax_tools_submit_feedback', 'tools_ajax_submit_feedback');
add_action('wp_ajax_nopriv_tools_submit_feedback', 'tools_ajax_submit_feedback');

function tools_ajax_submit_feedback() {
    check_ajax_referer('tools-nonce', 'nonce');
    
    $tool_name = sanitize_text_field($_POST['tool_name'] ?? '');
    $rating = intval($_POST['rating'] ?? 0);
    $comment = sanitize_textarea_field($_POST['comment'] ?? '');
    
    tools_insert_feedback($tool_name, $rating, $comment);
    
    wp_send_json_success(array('message' => 'Feedback submitted'));
}

// Autosoft Scan
add_action('wp_ajax_autosoft_scan', 'tools_ajax_autosoft_scan');

function tools_ajax_autosoft_scan() {
    check_ajax_referer('tools-nonce', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error(array('message' => 'Unauthorized'));
    }
    
    $barcode = sanitize_text_field($_POST['barcode'] ?? '');
    $device = tools_autosoft_scan_device($barcode);
    
    if ($device) {
        wp_send_json_success(array('device' => $device, 'exists' => true));
    } else {
        wp_send_json_success(array('exists' => false));
    }
}

// Autosoft Create Device
add_action('wp_ajax_autosoft_create_device', 'tools_ajax_autosoft_create');

function tools_ajax_autosoft_create() {
    check_ajax_referer('tools-nonce', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error(array('message' => 'Unauthorized'));
    }
    
    $barcode = sanitize_text_field($_POST['barcode'] ?? '');
    $device_data = $_POST['device_data'] ?? array();
    
    $id = tools_autosoft_create_device($barcode, $device_data);
    
    wp_send_json_success(array('id' => $id));
}

// Autosoft Add Check
add_action('wp_ajax_autosoft_add_check', 'tools_ajax_autosoft_add_check');

function tools_ajax_autosoft_add_check() {
    check_ajax_referer('tools-nonce', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error(array('message' => 'Unauthorized'));
    }
    
    $barcode = sanitize_text_field($_POST['barcode'] ?? '');
    $check_data = $_POST['check_data'] ?? array();
    
    $result = tools_autosoft_add_check($barcode, $check_data);
    
    if ($result) {
        wp_send_json_success(array('message' => 'Check added'));
    } else {
        wp_send_json_error(array('message' => 'Failed to add check'));
    }
}

// Get Pexels Videos
add_action('wp_ajax_get_pexels_videos', 'tools_ajax_pexels_videos');
add_action('wp_ajax_nopriv_get_pexels_videos', 'tools_ajax_pexels_videos');

function tools_ajax_pexels_videos() {
    $query = sanitize_text_field($_GET['query'] ?? 'technology');
    $per_page = intval($_GET['per_page'] ?? 10);
    $page = intval($_GET['page'] ?? 1);
    
    $data = tools_get_pexels_videos($query, $per_page, $page);
    
    wp_send_json($data);
}

// Get Pexels Photos
add_action('wp_ajax_get_pexels_photos', 'tools_ajax_pexels_photos');
add_action('wp_ajax_nopriv_get_pexels_photos', 'tools_ajax_pexels_photos');

function tools_ajax_pexels_photos() {
    $query = sanitize_text_field($_GET['query'] ?? 'technology');
    $per_page = intval($_GET['per_page'] ?? 15);
    $page = intval($_GET['page'] ?? 1);
    
    $data = tools_get_pexels_photos($query, $per_page, $page);
    
    wp_send_json($data);
}
