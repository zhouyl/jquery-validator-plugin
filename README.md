#jquery-validator-plugin

###表单自动验证辅助助手

####HTML Example

```html
<form>
    <input type="text" name="val1" data-require="is require" data-less="5,less than 5" />
    <input type="text" name="val2" data-match="selector,[name=val1],match val1" data-myformat="hello world." />
</form>
```

####JavaScript Example
```javascript
$form.validator({
    before:       function() { return boolVal; },
    isError:      function($ele, message) { return hasError; },
    error:        function($ele, message) { alert(message); },
    success:      function($ele) { },
    beforeSubmit: function() { return ! config.isError(); },
    submit:       function() { },
}, {
    myformat : function() { return boolVal; }
});
```