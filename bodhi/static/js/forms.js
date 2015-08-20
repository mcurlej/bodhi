// Defines a cabbage object that controls animation.
function Form(idx, url){
    this.idx = idx;
    this.url = url;
    // Using this is just temporary for now
    this.messenger = Messenger({theme: 'flat'});
}

Form.prototype.idx = null;
Form.prototype.url = null;

// TODO, we call start before we start and finish before we finish, each time.
// Ideally, it should not be possible to call start twice without the first
// start having gotten to a finish already.  This might be a good place to look
// into using "promises".
//
Form.prototype.start = function() {
    // TODO -- clear all error divs before attempt this,
    // both knock their content, and hide them
    cabbage.spin();
    $(this.idx + " button").attr("disabled", "disable");
}

Form.prototype.finish = function() {
    cabbage.finish();
    $(this.idx + " button").attr("disabled", null);
}

Form.prototype.success = function(data) {
    var self = this;
    // cornice typically returns errors hung on error responses, but here we
    // are adding our own "caveats" list *optionally* to successful responses
    // that can explain more about what happened.
    // For instance, you might submit an update with positive karma on your own
    // update.  We'll accept the comment (success!) but add a note to the
    // response informing you that your positive karma was stripped from the
    // payload.  Here we display those caveats to users.
    caveats = data.caveats || [];  // May be undefined...
    $.each(caveats, function(i, caveat) {
        msg = self.messenger.post({
            message: caveat.description,
            type: "info"
        });
    });
    msg = self.messenger.post({
        message: "Success",
        type: "success"
    });

    // And the preview.
    $('#preview').html('');

    self.finish();
}

Form.prototype.error = function(data) {
    var self = this;
    self.finish();
    // Here is where we handle those error messages on the response by cornice.
    $.each(data.responseJSON.errors, function (i, error) {
        msg = self.messenger.post({
            message: error.description,
            type: "error"
        });
    });
}

Form.prototype.data = function() {
    var data = {};
    $(this.idx + " :input").each(function() {
        if (data[this.name] === undefined) { data[this.name] = []; }
        if (this.type == 'radio' && ! this.checked) {
            // pass - don't add unchecked radio buttons to the submission
        } else if (this.type == 'checkbox' && ! this.checked) {
            // pass - don't add unchecked checkboxes to the submission
        } else {
            var value = $(this).val();
            if (value != "") {
                data[this.name].push(value);
            }
        }
    });

    // Flatten things into scalars if we can
    $.each(data, function (key, value) {
        if (value.length == 1) { data[key] = value[0]; }
    });

    return data;
}

Form.prototype.submit = function() {
    var self = this;
    self.start();

    $.ajax(this.url, {
        method: 'POST',
        data: JSON.stringify(self.data()),
        dataType: 'json',
        contentType: 'application/json',
        success: function(data) { return self.success(data); },
        error: function(data) { return self.error(data); },
    })
}
