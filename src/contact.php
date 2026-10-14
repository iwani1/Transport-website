<?php
/**
 * Contact / quote form handler for blaharbenyah.com
 *
 * Works on any standard cPanel/LAMP host (uses PHP's mail()). To change where
 * enquiries are delivered, edit the CONFIG block below and re-upload.
 *
 * Accepts POST from the forms on index.html and contact.html:
 *   name, email, telephone, service, subject, message, form (contact|quote|quick-quote)
 * Anti-spam: honeypot field "website", minimum fill time (_ts), header-injection filtering.
 * Responds with JSON when requested via fetch(), otherwise redirects to thank-you.html.
 */

// ---------------------------------------------------------------- CONFIG ----
$CONFIG = [
    // Where the enquiry e-mails go (comma-separate for several recipients)
    'to'        => 'TettehQuashieBlahar@gmail.com',
    // Must be an address on this domain so mail is not rejected by SPF/DMARC.
    // Create it in cPanel > Email Accounts (it does not need to receive mail).
    'from'      => 'noreply@blaharbenyah.com',
    'from_name' => 'Blahar & Benyah Website',
    'subject_prefix' => '[Website enquiry]',
    'thank_you_url'  => '/thank-you.html',
    'min_seconds'    => 3,      // submissions faster than this are treated as bots
    'max_length'     => 5000,   // characters allowed in the message body
];
// ---------------------------------------------------------------------------

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

$wantsJson = (isset($_POST['_ajax']) && $_POST['_ajax'] === '1')
    || (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest')
    || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false);

function respond(bool $success, string $message, int $status = 200): void
{
    global $wantsJson, $CONFIG;
    if ($wantsJson) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => $success, 'message' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if ($success) {
        header('Location: ' . $CONFIG['thank_you_url'], true, 303);
        exit;
    }
    // Non-JS fallback: send the visitor back to the contact page with the error in the URL.
    $back = '/contact.html?error=' . rawurlencode($message) . '#contact-form';
    header('Location: ' . $back, true, 303);
    exit;
}

function field(string $key, int $max = 500): string
{
    $v = isset($_POST[$key]) ? (string) $_POST[$key] : '';
    $v = trim($v);
    // Strip anything that could be used for e-mail header injection
    $v = str_replace(["\r", "\n", "%0a", "%0d", "\0"], ' ', $v);
    if (function_exists('mb_substr')) {
        return mb_substr($v, 0, $max, 'UTF-8');
    }
    return substr($v, 0, $max);
}

// ---- Method check -----------------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Location: /contact.html', true, 302);
    exit;
}

// ---- Same-origin check (soft) ------------------------------------------------
$host = $_SERVER['HTTP_HOST'] ?? '';
foreach (['HTTP_ORIGIN', 'HTTP_REFERER'] as $h) {
    if (!empty($_SERVER[$h]) && $host !== '') {
        $srcHost = parse_url($_SERVER[$h], PHP_URL_HOST);
        if ($srcHost && strcasecmp($srcHost, $host) !== 0 && strcasecmp($srcHost, 'www.' . $host) !== 0 && strcasecmp('www.' . $srcHost, $host) !== 0) {
            respond(false, 'The form could not be verified. Please reload the page and try again.', 403);
        }
        break;
    }
}

// ---- Anti-spam ---------------------------------------------------------------
if (field('website') !== '') {
    // Honeypot filled in: pretend everything is fine so the bot moves on.
    respond(true, 'Thank you — your message has been sent.');
}
$ts = (int) field('_ts', 20);
if ($ts > 0 && (time() - $ts) < $CONFIG['min_seconds']) {
    respond(false, 'That was a little too quick — please try sending again.', 429);
}

// ---- Collect & validate ------------------------------------------------------
$formType  = field('form', 40) ?: 'contact';
$name      = field('name', 120);
$email     = field('email', 200);
$telephone = field('telephone', 60);
$service   = field('service', 120);
$subject   = field('subject', 200);
$message   = isset($_POST['message']) ? trim((string) $_POST['message']) : '';
$message   = str_replace("\0", '', $message);
if (function_exists('mb_substr')) {
    $message = mb_substr($message, 0, $CONFIG['max_length'], 'UTF-8');
} else {
    $message = substr($message, 0, $CONFIG['max_length']);
}

$errors = [];
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'a valid e-mail address';
}
if ($formType !== 'quick-quote') {
    if ($name === '') { $errors[] = 'your name'; }
    if ($message === '' && $formType === 'contact') { $errors[] = 'a message'; }
}
if ($errors) {
    respond(false, 'Please provide ' . implode(', ', $errors) . '.', 422);
}

// ---- Build the e-mail --------------------------------------------------------
$labels = [
    'contact'     => 'Contact form message',
    'quote'       => 'Quote request',
    'quick-quote' => 'Quick quote request (homepage)',
];
$kind = $labels[$formType] ?? 'Website enquiry';

$lines = [];
$lines[] = $kind . ' from blaharbenyah.com';
$lines[] = str_repeat('-', 60);
if ($name !== '')      { $lines[] = 'Name:      ' . $name; }
$lines[]               = 'Email:     ' . $email;
if ($telephone !== '') { $lines[] = 'Telephone: ' . $telephone; }
if ($service !== '')   { $lines[] = 'Service:   ' . $service; }
if ($subject !== '')   { $lines[] = 'Subject:   ' . $subject; }
$lines[] = '';
$lines[] = $message !== '' ? $message : '(no message — please follow up with the sender)';
$lines[] = '';
$lines[] = str_repeat('-', 60);
$lines[] = 'Sent: ' . date('Y-m-d H:i:s T');
$lines[] = 'IP:   ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$lines[] = 'Page: ' . ($_SERVER['HTTP_REFERER'] ?? 'unknown');
$body = implode("\n", $lines);
$body = wordwrap($body, 990, "\n", true);

$mailSubject = $CONFIG['subject_prefix'] . ' ' . $kind . ($service !== '' ? ' — ' . $service : '') . ($name !== '' ? ' — ' . $name : '');
$encodedSubject = '=?UTF-8?B?' . base64_encode($mailSubject) . '?=';
$encodedFromName = '=?UTF-8?B?' . base64_encode($CONFIG['from_name']) . '?=';

$headers = [
    'From: ' . $encodedFromName . ' <' . $CONFIG['from'] . '>',
    'Reply-To: ' . ($name !== '' ? '=?UTF-8?B?' . base64_encode($name) . '?= ' : '') . '<' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: blaharbenyah.com contact form',
];

$sent = @mail($CONFIG['to'], $encodedSubject, $body, implode("\r\n", $headers), '-f' . $CONFIG['from']);

if (!$sent) {
    error_log('[blaharbenyah.com] contact form: mail() failed for ' . $email);
    respond(false, 'Sorry, your message could not be sent right now. Please call or WhatsApp us instead.', 500);
}

respond(true, 'Thank you — your message has been sent. We will get back to you shortly.');
