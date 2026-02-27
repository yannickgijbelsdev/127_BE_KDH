<?php
/**
 * Tools Functions
 */

if (!defined('ABSPATH')) exit;

function tools_get_config($tool_id) {
    $args = array(
        'post_type' => 'diagnostic_tool',
        'meta_query' => array(
            array(
                'key' => '_tool_id',
                'value' => $tool_id,
                'compare' => '='
            )
        ),
        'posts_per_page' => 1
    );
    
    $query = new WP_Query($args);
    
    if ($query->have_posts()) {
        $query->the_post();
        $tool = array(
            'id' => get_post_meta(get_the_ID(), '_tool_id', true),
            'name' => get_the_title(),
            'enabled' => get_post_meta(get_the_ID(), '_tool_enabled', true) === '1'
        );
        wp_reset_postdata();
        return $tool;
    }
    
    return null;
}
