/**
 * 表单自动验证辅助助手
 *
 * @example HTML
 *      <form>
 *          <input type="text" name="val1"
 *                 data-required="is required"
 *                 data-less="5,less than 5" />
 *          <input type="text" name="val2"
 *                 data-match="selector,[name=val1],match val1"
 *                 data-myformat="hello world." />
 *      </form>
 *
 * @example JavaScript
 *      $form.validator({
 *          before:       function() { return boolVal; },
 *          isError:      function(message) { return hasError; },
 *          error:        function(message) { alert(message); },
 *          success:      function() {},
 *          beforeSubmit: function() { return boolVal; },
 *          submit:       function() { },
 *      }, {
 *          myformat : function() { return boolVal; }
 *      });
 */
$.fn.validator = function(options, formats) {

    var form = this,
        $form = $(this),
        $inputs = $form.find('input,select,textarea');

    if (!$form.is('form') || $inputs.length === 0) {
        return false;
    }

    var config = $.extend({

        // 触发校验的事件
        events: 'keyup blur',

        // 错误控制 class
        errclass: 'validator-error',

        // 参数解析
        parse: function(str) {
            var args = str.split(',');
            if (args.length > 1) {
                return {
                    message: args.pop(),
                    args: args
                };
            }
            return {
                message: str,
                args: []
            };
        },

        // 检验方法
        formats: {
            alnum: /^[a-z0-9]+$/i,
            alpha: /^[a-z]+$/i,
            lower: /^[a-z]+$/,
            upper: /^[A-Z]+$/,
            word: /^\w+$/,
            number: /^[\+\-]?[\d\.]+$/,
            url: /^https?:\/\/([a-z0-9\-]+\.)+[a-z]{2,3}([a-z0-9_~#%&\/\'\+\=\:\?\.\-])*$/i,
            date: /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,
            datetime: /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\s+\d{1,2}(:\d{1,2}){1,2}$/,
            email: /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
            password: /^.{6,30}$/,
            nickname: /^[^\'\"\:;,\<\>\?\/\\\*\=\+\{\}\[\]\)\(\^%\$#\!`\s]+$/,
            phone: /^[\d\- ]{5,}$/,
            mobile: /^\d{8,13}$/,
            required: function() {
                return $.trim(this.value) != '';
            },
            regex: function() {
                // 避免正则中逗号分割，使用 arguments 重新组装正则
                var args = new Array();
                for (key in arguments) {
                    args.push(arguments[key]);
                }

                return eval(args.join(',')).test(this.value);
            },
            max: function(max, selector) {
                if (max == 'selector') {
                    max = $(max).val();
                }
                return parseFloat(max) >= parseFloat(this.value);
            },
            min: function(min, selector) {
                if (min == 'selector') {
                    min = $(selector).val();
                }
                return parseFloat(min) <= parseFloat(this.value);
            },
            range: function(min, max) {
                var val = parseFloat(this.value);
                return val >= parseFloat(min) && val <= parseFloat(max);
            },
            match: function(val, selector) {
                if (val == 'selector') {
                    val = $(selector).val();
                }
                return val == this.value;
            },
            minlen: function(min) {
                return $.trim(this.value).length <= min;
            },
            maxlen: function(min) {
                return $.trim(this.value).length <= min;
            },
            length: function(min, max) {
                var len = $.trim(this.value).length;
                return len >= parseInt(min) && len <= parseInt(max);
            }
        },

        // 检验前执行
        before: function() {
            return true;
        },

        // 是否错误
        isError: function() {
            return false;
        },

        // 错误处理
        error: function(message) {},

        // 成功处理
        success: function() {},

        // 检验后执行
        after: function(isSucceed) {},

        // 表单提交前
        beforeSubmit: function(event) {
            return true;
        },

        // 表单提交
        submit: function(event) {
            return true;
        }

    }, options);

    // 扩展检验格式
    if (typeof formats == 'object') {
        $.extend(config.formats, formats);
    }

    // 绑定检验事件
    $inputs.on('validate', function() {

        var self = this,
            $self = $(this),
            error = function(message) {
                $self.addClass(config.errclass);
                config.error.call(self, message);
                config.after.call(self, false);
            };

        // 检测之前执行
        if (!config.before.call(self)) {
            return false;
        }

        // 检测空值
        if ($self.data('required') && !config.formats['required'].call(self)) {
            return error($self.data('required'));
        }

        for (var key in config.formats) {
            if ((self.value != '' || key == 'match') && $self.data(key)) {
                // 函数校验
                if (typeof config.formats[key] == 'function') {
                    var parsed = config.parse($self.data(key));
                    if (!config.formats[key].apply(self, parsed.args)) {
                        return error(parsed.message);
                    }
                    // 正则检验
                } else if (!config.formats[key].test(self.value)) {
                    return error($self.data(key));
                }
            }
        }

        $self.removeClass(config.errclass);

        config.success.call(self);
        config.after.call(self, true);
    });

    // 绑定表单提交
    $form.on('submit', function(event) {
        $inputs.trigger('validate');

        var $errors = $inputs.filter('.' + config.errclass),
            $first  = $errors.filter(':first'),
            isError = config.beforeSubmit.call(form, event) && $errors.length === 0 && !config.isError.call(form);

        if ($errors.length > 0) {
            if ($first.is(':hidden')) {
                $(document).scrollTop($first.offset().top - 50); // 滚动到第一个错误控件附近
            } else {
                $first.focus(); // 聚焦第一个错误控件
            }

            // 闪现错误表单
            for (var i = 0; i < 8; i++) {
                setTimeout(function() {
                    $errors.toggleClass(config.errclass, i % 2);
                }, (i + 1) * 100);
            }

            $errors.addClass(config.errclass);
        }

        return isError && config.submit.call(form, event);
    });

    // 绑定控件事件
    if (config.events) {
        $inputs.on(config.events, function() {
            $(this).trigger('validate');
        });
    }

    return $form;

};
