define(function(require) {
    var events = require('base/js/events');
    function load_ipython_extension() {

        var toggle_cell = function(cell) {
            if (cell.element.hasClass('xnb-selected')) {
                cell.element.removeClass('xnb-selected');
            } else {
                cell.element.addClass('xnb-selected');
            }
            
            var data = [];
            $('.cell.xnb-selected').each(function(index, cell) {
                data.push($(cell).data('cell').toJSON());
            });
            data = JSON.stringify(data);
            clipboard_text.clippable = data;
            clipboard_text[0].value = data;
            clipboard_text[0].focus();
            clipboard_text[0].select();
        };

        var register_cell = function(cell) {
            cell.element.click(function(e) {
                // If shift isn't held, deselect all other cells.
                if (!e.shiftKey) {
                    $('.cell.xnb-selected').each(function(index, cell) {
                        $(cell).removeClass('xnb-selected');
                    });
                }
                
                var inner_cell = cell.element.find('.inner_cell');
                var el = e.target;
                while (el != cell.element[0]) {
                    if (inner_cell[0] == el) {
                        return;
                    }
                    el = $(el).parent()[0];
                }
                toggle_cell(cell);
            });
        };

        var replace = function() {
            setTimeout(function() {
                clipboard_text[0].value = clipboard_text.clippable;
                clipboard_text[0].focus();
                clipboard_text[0].select();
            }, 0);
        };

        var handle_paste = function(e) {
           var pasted = e.originalEvent.clipboardData.getData(e.originalEvent.clipboardData.types[0]);
            e.preventDefault();
            
            var cells = null;
            try {
                cells = JSON.parse(pasted);
            } catch (error) {}

            var iscells = cells !== null && cells.length > 0 && cells[0].cell_type !== undefined;
            if (iscells) {
                var selected = $('.cell.xnb-selected');
                var last_selected = $(selected[selected.length-1]).data('cell');
                var index = IPython.notebook.find_cell_index(last_selected);
                cells.forEach(function(cellJSON) {
                    var cell = IPython.notebook.insert_cell_below('code', index);
                    cell.fromJSON(cellJSON);
                    index++;
                });
            }
        };

        var clipboard_text = $('<textarea/>')
            .css({
                position: 'absolute',
                left: -100,
                top: -100,
                width: 1,
                height: 1,
            }).appendTo('body');

        clipboard_text.on('paste', handle_paste);
        clipboard_text.on('keypress', replace);
        clipboard_text.on('keyup', replace);

        events.on('create.Cell', function(e, data) {
            register_cell(data.cell);
        });
        IPython.notebook.get_cells().forEach(function(cell) {
            register_cell(cell);
        });


        var css = document.createElement("style");
        css.type = "text/css";
        css.innerHTML = ".cell.xnb-selected { background: #DDEEFF }";
        document.body.appendChild(css);
    }

    return {load_ipython_extension: load_ipython_extension};
});
