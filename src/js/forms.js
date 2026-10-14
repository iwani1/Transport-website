/* Progressive enhancement for the contact / quote forms.
 * Without JavaScript the forms still submit normally and land on thank-you.html.
 * With JavaScript we post in the background and show the result inline. */
(function () {
    'use strict';

    var forms = document.querySelectorAll('form[data-ajax-form]');
    if (!forms.length || !window.fetch || !window.FormData) { return; }

    function setStatus(form, type, message) {
        var box = form.querySelector('.form-status');
        if (!box) { return; }
        box.textContent = message;
        box.className = 'form-status is-visible ' + (type === 'ok' ? 'is-success' : 'is-error');
        box.setAttribute('role', type === 'ok' ? 'status' : 'alert');
    }

    forms.forEach(function (form) {
        // Record when the form was rendered — submissions faster than 3s are treated as bots server-side.
        var ts = form.querySelector('input[name="_ts"]');
        if (ts) { ts.value = String(Math.floor(Date.now() / 1000)); }

        form.addEventListener('submit', function (e) {
            if (!form.checkValidity || !form.checkValidity()) { return; } // let the browser show validation UI
            e.preventDefault();

            var button = form.querySelector('[type="submit"]');
            var originalLabel = button ? button.innerHTML : '';
            if (button) { button.disabled = true; button.innerHTML = 'Sending…'; }

            var data = new FormData(form);
            data.append('_ajax', '1');

            fetch(form.getAttribute('action'), {
                method: 'POST',
                body: data,
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
            })
                .then(function (res) { return res.json().catch(function () { return { success: res.ok }; }); })
                .then(function (json) {
                    if (json && json.success) {
                        form.reset();
                        if (ts) { ts.value = String(Math.floor(Date.now() / 1000)); }
                        setStatus(form, 'ok', json.message || 'Thank you — your message has been sent. We will get back to you shortly.');
                    } else {
                        setStatus(form, 'error', (json && json.message) || 'Sorry, your message could not be sent. Please call or WhatsApp us instead.');
                    }
                })
                .catch(function () {
                    setStatus(form, 'error', 'Sorry, we could not reach the server. Please check your connection or call us.');
                })
                .finally(function () {
                    if (button) { button.disabled = false; button.innerHTML = originalLabel; }
                });
        });
    });
})();
