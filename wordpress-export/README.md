# 127 Tools - Complete Export Package

## 📦 Inhoud

Deze export bevat standalone HTML+CSS+JS code voor alle pagina's van 127.be die je direct in WordPress kunt gebruiken.

## 📄 Pagina's Geëxporteerd

1. **01-landing-page.html** - Home page met tool cards en video achtergrond
2. **02-dead-pixel-detector.html** - Pixel test tool (VOLGT)
3. **03-printer-tester.html** - Printer test tool (VOLGT)
4. **04-screen-refresh.html** - Screen refresh rate tester (VOLGT)
5. **05-webcam-audio.html** - Webcam & audio tester (VOLGT)
6. **06-password-generator.html** - Password generator tool (VOLGT)
7. **07-admin-login.html** - Admin login pagina (VOLGT)
8. **08-admin-dashboard.html** - Admin dashboard (VOLGT)
9. **09-autosoft-dashboard.html** - Autosoft device management (VOLGT)

## 🔧 Hoe te Gebruiken in WordPress

### Methode 1: Custom Page Templates (Aanbevolen)

1. **Maak een child theme** of gebruik je bestaande thema
2. Kopieer de HTML code naar een PHP page template
3. Wrap de code in WordPress template format:

```php
<?php
/**
 * Template Name: Dead Pixel Detector
 */

// Disable WordPress header/footer
?>
<!DOCTYPE html>
<html lang="nl">
<head>
    <!-- PLAK HIER DE <head> CONTENT VAN HET HTML BESTAND -->
</head>
<body>
    <!-- PLAK HIER DE <body> CONTENT VAN HET HTML BESTAND -->
</body>
</html>
```

4. Maak een nieuwe pagina in WordPress
5. Selecteer het custom template
6. Publiceer

### Methode 2: Shortcode (Flexibeler)

1. Voeg deze code toe aan functions.php:

```php
function tool_page_shortcode($atts) {
    $atts = shortcode_atts(array(
        'tool' => 'dpd'
    ), $atts);
    
    ob_start();
    include(get_stylesheet_directory() . '/tools/' . $atts['tool'] . '.php');
    return ob_get_clean();
}
add_shortcode('tool', 'tool_page_shortcode');
```

2. Gebruik `[tool tool="dpd"]` in je pagina

### Methode 3: Iframe (Makkelijkst maar minder ideaal)

```html
<iframe src="/tools/dead-pixel-detector.html" width="100%" height="800px" frameborder="0"></iframe>
```

## 🎨 Styling Aanpassen

Alle styling staat inline in de HTML bestanden. Om aan te passen:

1. Zoek de `<style>` sectie in de HTML
2. Pas CSS variabelen aan:

```css
:root {
    --color-primary: #8ab4f8;   /* Primaire kleur */
    --color-dark: #202124;      /* Donkere achtergrond */
    --color-text: #e8eaed;      /* Tekst kleur */
}
```

## 🔗 WordPress Integraties Aanpassen

### 1. Pexels Videos/Images

Vervang in de JavaScript:

```javascript
// VAN:
const backendUrl = window.location.origin;
const response = await fetch(`${backendUrl}/wp-admin/admin-ajax.php?action=get_pexels_videos...`);

// NAAR: (als je de AJAX handler hebt geïnstalleerd)
// Werkt automatisch met de inc/ajax-handlers.php uit het WordPress thema
```

### 2. Analytics Tracking

Vervang:

```javascript
// VAN:
console.log('Track event');

// NAAR:
jQuery.post(ajaxurl, {
    action: 'tools_track_event',
    nonce: '<?php echo wp_create_nonce("tools-nonce"); ?>',
    tool_id: 'dpd',
    tool_name: 'Dead Pixel Detector',
    event_type: 'page_visit'
});
```

### 3. Feedback Forms

Vervang:

```javascript
// VAN:
alert('Feedback feature');

// NAAR:
jQuery.post(ajaxurl, {
    action: 'tools_submit_feedback',
    nonce: '<?php echo wp_create_nonce("tools-nonce"); ?>',
    tool_name: 'Dead Pixel Detector',
    rating: 5,
    comment: 'Great tool!'
});
```

## ⚙️ WordPress Theme Files Needed

Als je de volledige functionaliteit wilt, heb je ook nodig:

1. **inc/ajax-handlers.php** - Voor AJAX endpoints
2. **inc/database.php** - Voor database functies
3. **functions.php** - Theme setup

Deze staan in: `/app/wordpress-theme/127-tools-theme/`

## 🚀 Quick Start Checklist

- [ ] Kopieer HTML bestand naar WordPress theme directory
- [ ] Maak een nieuwe pagina met custom template
- [ ] Test de tool functionaliteit
- [ ] Pas styling aan naar je huisstijl
- [ ] Integreer analytics (optioneel)
- [ ] Integreer feedback formulier (optioneel)
- [ ] Test op mobiel

## 💡 Tips

1. **Performance**: De HTML bestanden zijn self-contained maar groot. Overweeg om CSS/JS te externaliseren voor betere caching.

2. **SEO**: Voeg meta tags toe in de `<head>` sectie:
```html
<meta name="description" content="Test je scherm op dode pixels">
<meta name="keywords" content="dead pixel, screen test, monitor test">
```

3. **Mobile**: Alle tools zijn responsive, maar test altijd op echte devices.

4. **Pexels API**: Zorg dat je PEXELS_API_KEY in wp-config.php staat:
```php
define('PEXELS_API_KEY', 'your-api-key-here');
```

## 📞 Support

Voor vragen: zie de React source code in `/app/frontend/src/components/`

## 📋 Status

✅ Landing Page - COMPLEET
⏳ Dead Pixel Detector - IN PROGRESS
⏳ Andere tools - WACHTEND

---

Gemaakt voor 127.be | Yannick Tools
