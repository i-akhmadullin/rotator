/*
* Получение номера страницы, на котором находится слайдер:
*  var current = $('#slider1').data('rotator').currentPage; // возвращает номер страницы #
*
* Переключение на слайд (внешняя ссылка):
*  <a href="#" id="slide-jump">Slide 4</a>
*  $("#slide-jump").click(function(){
*    $('#slider2').rotator2(4);
*  });
*
*  Управление режимом слайдшоу
*  $('#slider1').data('rotator').goNextPage(); // переключить на след слайд
*  $('#slider1').data('rotator').goPrevPage(); // вернутся на пред слайд
*/
;(function ($) {
    $.rotator2 = function(el, options) {

        var base = this, o; // o - это настройки
        base.$el = $(el);

        base.currentPage = 1;
        base.timer       = null;    // Таймер, автоматически переключает слайды
        base.animating   = false;   // Индикатор того, что ротатор в процессе анимации между слайдами
        base.playing     = false;   // Внутренний индикатор активности режима слайдшоу
        base.items       = [];      // Массив слайдов

        base.init = function() {
            if (base.$el.data("rotator")) {
                console.log( 'fu' );
                return false;
            }
            base.$el.data("rotator", base);

            base.options = o = $.extend({},$.rotator2.defaults, options);
            if (o.blocksChangePerPage > o.blocksPerScreen) { o.blocksChangePerPage = o.blocksPerScreen; }

            base.$items = base.$el.find(o.itemsSelector);
            base.items  = base.$items.toArray();

            base.items_count       = base.$items.length;
            base.containerName     = "b-rotator__container";                                            // В контейнер с таким классом будут обёрнуты все слайды
            base.containerSelector = "." + base.containerName;                                      // Селектор для контейнера
            base.after_animate_css = { 'margin-left': "-100%", 'left': 0 };

            var buttons_array = [];
            if (o.prev) { buttons_array.push(o.prev); }
            if (o.next) { buttons_array.push(o.next); }
            o.buttons_selector = buttons_array.join(', ');      // объединили CSS-селекторы кнопок "вперед" и "назад" в единый селектор

            if (o.blocksPerScreen > o.items_count) { o.blocksPerScreen = base.items_count; }
            if (!$.isFunction( $.easing[o.easing] )) { o.easing = "swing"; }

            base.page_count = Math.ceil(base.items_count / o.blocksChangePerPage);                          // кол-во страниц слайдера = кол-во слайдов / сколько менять за 1 экран
            base.block_count = Math.ceil(base.items_count / o.blocksPerScreen) + 1;                 // кол-во блоков = кол-во слайдов / сколько влазит на страницу
            base.container_width = 100 * 4;
            base.items_width = 100 / (4 * o.blocksPerScreen);

            base.$items.each(function (i) { $(this).data('index', i + 1).attr("index", i + 1); })
                .css('width', base.items_width + '%')
                .wrapAll('<div style="width: ' + base.container_width+'%;' + '" class="'+base.containerName+'"/>');
            base.$container = base.$el.find(base.containerSelector);
            base.$el.css("overflow", o.containerOverflow);
            /*base.$el.parent().prepend( $("<a href=\"#\"><span>&nbsp;</span></a>").addClass("RotatorPrevLink").attr("id","RotatorPrevLink"),
                $("<a href=\"#\"><span>&nbsp;</span></a>").addClass("RotatorNextLink").attr("id","RotatorNextLink"));*/

            if(base.page_count > 3) {   // сдвигаем массив слайдов так чтобы вначале стояли слайды с последней страницы
                base.rotateItems(o.startPage);
                base.refreshSlider();
                //base.$container.find(o.itemsSelector).remove();                               // убираем в память все слайды
                //base.$container.append(base.items.slice(0, 3*o.blocksPerScreen));             // добавляем слайдов только на три страницы
                base.$container.css({ 'margin-left': -base.items_width * 4 * o.blocksPerScreen + '%' });
            }

            if (base.items_count <= o.blocksPerScreen) {
                base.$el.addClass("not-enough-slides-static");
                $(o.buttons_selector).hide();
                base.$el.closest('.b-rotator-wrapper').find(o.navSelector).hide();
            } else {
                base.buildNextPrevButtons();
                if (o.navSelector && base.page_count > 1) {
                    base.buildNavigation();
                }
                if (o.useSwipeTouch) {
                    base.addSwipeTouchListener();
                }
                if (o.keyboardNavigation) {
                    base.addKeyboardListener();
                }
                if (o.autoPlay) {
                    base.playing = true;
                    base.startStop();
                }
                if (o.pauseOnHover) {
                    base.addOnHoverListener();
                }
                if (o.hashPrefix) {
                    base.addHashChangeListener();
                    $(window).trigger('hashchange');
                }
            }
            if (o.autoWidthCheck) {
                var isOpera = !!$.browser.opera;
                if(o.autoWidthCheck == "opera") {
                    if(isOpera) { base.checkResize(); }
                } else { base.checkResize(); }
            }
        };

        /* Обработчик изменения хэша страницы */
        base.addHashChangeListener = function() {
            $(window).bind("hashchange", function(e) {
                var page = e.getState(o.hashPrefix, true) || 1;
                if (!base.animating) {
                    base.gotoPage(page);
                } else {
                    //console.log("сменился хэш, в то время как ротатор анимируется, игнор");
                }
            });
        };
        base.addSwipeTouchListener = function() {
            $(this).bind({
                "swipeleft": function () {
                    if (!base.animating) { base.goNextPage(); }
                },
                "swiperight": function () {
                    if (!base.animating) { base.goPrevPage(); }
                }
            });
        };
        base.addKeyboardListener = function() {
            $(document).keydown(function(e) {
                if (base.animating) { return false; }
                if (e.which == 37) {
                    base.goPrevPage();
                } else if (e.which == 39) {
                    base.goNextPage();
                }
            });
        };
        base.addOnHoverListener = function() {
            var rotator_area = [];              // ротатор + next + prev + navigation
            rotator_area.push(base);
            if (o.prev) { rotator_area.push(o.prev); }
            if (o.next) { rotator_area.push(o.next); }
            if (o.navSelector) { rotator_area.push(o.navSelector); }
            $(rotator_area.join(', ')).hover(
                function() { base.clearTimer(); },
                function() { base.startStop(); } );
        };
        /* Инициализация навигационной панели */
        base.buildNavigation = function() {
            var page_count = base.page_count,
                pages_in_page, changeCount,
                navigation = base.$el.closest('.b-rotator-wrapper').find(o.navSelector);
            for (var i = 0; i < page_count; i++) {
                pages_in_page = [];
                changeCount = o.blocksChangePerPage;
                for (var j = i * changeCount + 1; j < ((i + 1) * changeCount + 1); j++) {
                    pages_in_page.push(j);
                }
                var nav_link = $(o.navPageTemplate.replace("$i", (i + 1))).data('page', i).data('items', pages_in_page);
                if (o.hashPrefix) { nav_link.attr("href", "#" + o.hashPrefix + "=" + (i + 1)); }
                if (o.navDrawPageNumber) { nav_link.text(i + 1); }
                navigation.append(nav_link);
            }
            navigation.find('a').first().addClass('Active');
            navigation.delegate('a', 'click', function () {
                if (base.animating || $(this).hasClass('Active')) { return false; }
                var target_page = $(this).data('items')[0];
                var pageIndex = (target_page-1)/o.blocksChangePerPage + 1;

                navigation.removeClass('Active');
                $(this).addClass('Active');
                if (o.hashPrefix) { base.updateHashUrl(target_page); }
                base.gotoPage(pageIndex);
                return false;
            });
        };
        /* Инициализация кнопок вперед/назад */
        base.buildNextPrevButtons = function() {
            if (o.hashPrefix) { base.updateNextPrevLinks(); }
            base.$el.closest('.b-rotator-wrapper').find(o.buttons_selector).click(function () {
                if(!base.animating) {
                    if ($(this).is(o.prev)) { base.goPrevPage(); }
                    else { base.goNextPage(); }
                }
                return false;
            });
        };
        /* startStop(false) - поставить на паузу, startStop(true) - запустить слайдшоу */
        base.startStop = function() {
            if (base.playing !== true) { base.playing = false; }

            if (base.playing) {
                base.clearTimer();
                base.timer = setTimeout(function() {
                    if (!base.animating) { base.goNextPage(); }
                }, o.delay + o.duration);
            } else { base.clearTimer(); }
        };
        base.clearTimer = function() {
            if (base.timer) { clearTimeout(base.timer); base.timer = null; }        // Обнуляем таймер, если он был установлен
        };
        /* Обновляет хэш адресной строки: префикс_ротатора=target_page */
        base.updateHashUrl = function(target_page) {
            var state = {};
            state[o.hashPrefix] = target_page;
            $.bbq.pushState(state);
        };

        /* Обновляет хэши у кнопок вперед/назад */
        base.updateNextPrevLinks = function() {
            var prev_index = getPrevPageIndex(base.currentPage),
                next_index = getNextPageIndex(base.currentPage);
            $(o.prev).attr("href", "#" + o.hashPrefix + "=" + prev_index);
            $(o.next).attr("href", "#" + o.hashPrefix + "=" + next_index);
        };

        /* загружаем слайд на который переходим и его соседей начиная с правого */
        base.loadSlideAndSiblings = function($slide) {
            if ($slide.length > 0) {
                base.loadSlide( $slide );
                base.loadSlide( $slide.next() );
                base.loadSlide( $slide.prev() );
            }
        };

        base.loadSlide = function($slide) {
            //$(".ContentRotatorLoader").show();
            if ($slide) {
                var slide_src = $slide.attr('loadsrc');
                if (slide_src) {
                    $("<img />").attr('src', slide_src)
                        .load(function(/*response*/) {
                            //var img = $(response.currentTarget).attr('src');
                            $slide.attr('src', slide_src);
                        });
                }
                //$(".ContentRotatorLoader").hide();
            } else { /* нет такого слайда */ }
        };

        base.changeToSlide = function(index) {
            var src_to_load = base.$items.eq(index-1).attr('loadsrc'),
                $loader = $(".ContentRotatorLoader").show();
            base.$container.children(o.itemsSelector).first().attr('src', src_to_load);
            $loader.hide();
            if (o.hashPrefix) { base.updateNextPrevLinks(); }
            base.animating = false;
            if (o.onMoveComplete && typeof(o.onMoveComplete) == 'function') {
                o.onMoveComplete(base.currentPage);
            }
        };
        /* Переход на страницу с указанным индексом и prev/next - перейти на пред/след страницу */
        base.gotoPage = function(end_index) {
            if (base.animating || base.currentPage == end_index) { return; }
            base.animating = true;
            base.clearTimer();

            var value_right, step, is_prev,
                rotator_container = base.$container,
                start_index       = base.currentPage;

            if (end_index == 'prev' || end_index == 'next') {
                step      = o.blocksChangePerPage;
                is_prev   = (end_index == 'prev');
                end_index = parseInt( is_prev ? getPrevPageIndex(start_index) : getNextPageIndex(start_index), 10);
            } else {
                step         = Math.abs(start_index - end_index) * o.blocksChangePerPage;
                step         = (step > base.items_count / 2) ? base.items_count - step : step;
                value_right  = ((start_index-1)*o.blocksChangePerPage + 1 + step) % base.items_count;
                value_right  = (value_right == 0) ? base.items_count : value_right;
                is_prev      = (value_right != (end_index-1)*o.blocksChangePerPage+1);
                if (step == base.items_count / 2) { is_prev = false; }
                end_index    = parseInt(end_index, 10);
            }
            base.nextPage = end_index;
            if (is_prev && step > o.blocksPerScreen) {      // будут "пропущены" слайды между экранами
                rotator_container.find(o.itemsSelector).slice(-o.blocksPerScreen).remove();
                base.rotateItems((end_index-1)*o.blocksChangePerPage+1);

                var slidesToAdd = base.items.slice(o.blocksPerScreen, 2*o.blocksPerScreen);
                if (slidesToAdd.length == o.blocksPerScreen) {
                    rotator_container.prepend(slidesToAdd);
                    var notEnoughSlides = 3*o.blocksPerScreen - rotator_container.find(o.itemsSelector).length;
                    if (notEnoughSlides > 0) {
                        rotator_container.prepend(base.items.slice(o.blocksPerScreen-notEnoughSlides,2*o.blocksPerScreen-notEnoughSlides));
                    }
                }
                var extraBlocks = 3*o.blocksPerScreen - rotator_container.find(o.itemsSelector).length;
                rotator_container.css('margin-left', -200-100*(extraBlocks/o.blocksPerScreen) + '%');
            } else if (!is_prev && step > 2*o.blocksPerScreen-1) {      // будут "пропущены" слайды между экранами
                base.rotateItems((end_index-1)*o.blocksChangePerPage+1);
                rotator_container.find(o.itemsSelector).slice(0, o.blocksPerScreen).remove();

                rotator_container.append(base.items.slice(o.blocksPerScreen, 2*o.blocksPerScreen));
                rotator_container.css('margin-left', 0 + '%');
            } else if (!is_prev && step > o.blocksPerScreen && step <= 2*o.blocksPerScreen) {
                base.rotateItems((end_index-1)*o.blocksChangePerPage+1);
                var blocksToDel = Math.abs(step) % o.blocksPerScreen;

                var toDel = rotator_container.find(o.itemsSelector).slice(0, blocksToDel);
                rotator_container.find(o.itemsSelector).slice(0, blocksToDel).remove();
                rotator_container.append( toDel );

                var marginLeft = -100 + (is_prev ? -100 : 100)*(blocksToDel/o.blocksPerScreen);
                rotator_container.css('margin-left', marginLeft + '%');
            } else {    // слайдимся по обычному
                base.rotateItems((end_index-1)*o.blocksChangePerPage+1);
                base.refreshSlider();

                var marginLeft = -100 + (is_prev ? -100 : 100)*(step/o.blocksPerScreen);
                rotator_container.css('margin-left', marginLeft + '%');
            }
            if (o.onBeforeAnimation && typeof(o.onBeforeAnimation) == 'function') {
                o.onBeforeAnimation(base.nextPage);
            }
            
            base.animateRotator(start_index, step, is_prev);
            base.startStop();
        };
        base.animateRotator = function(start_index, step, is_prev) {
            var animationStep = Math.min(step, 2*o.blocksPerScreen);
            var move_by = animationStep * 100 / o.blocksPerScreen,
                container_shift = ((is_prev) ? '+' : '-') + '=' + move_by + '%';

            base.$container.animate({ left: container_shift}, {
                duration: o.duration,
                easing: o.easing,
                complete: function () {
                    base.onAnimationComplete();
                }
            });
        };
        base.onAnimationComplete = function() {
            var rotator_container = base.$container,
                $navlinks = base.$el.closest('.b-rotator-wrapper').find(o.navSelector).find('a');

            base.refreshSlider();
            rotator_container.css(base.after_animate_css);

            base.rotateItems(base.nextPage*o.blocksChangePerPage);
            base.currentPage = base.nextPage;

            if (o.navSelector) { $navlinks.removeClass('Active').eq(base.currentPage-1).addClass("Active"); }
            if (o.hashPrefix) { base.updateNextPrevLinks(); }
            base.animating = false;
            if (o.onMoveComplete && typeof(o.onMoveComplete) == 'function') {
                o.onMoveComplete(base.currentPage);
            }
        };
        base.refreshSlider = function () {
            base.$container.find(o.itemsSelector).remove();
            base.$container.append(base.items.slice(0, 3 * o.blocksPerScreen));
            if (base.items.length < 3 * o.blocksPerScreen) {
                $(base.items.slice(0, o.blocksPerScreen)).clone()
                    .appendTo(base.$container);
            }
            base.$container.find(o.itemsSelector).remove();
            base.$container.append(base.items.slice(0, 3*o.blocksPerScreen));
        };
        base.goNextPage = function() {
            if (o.hashPrefix) { base.updateHashUrl(getNextPageIndex(base.currentPage)); }
            base.gotoPage('next');
        };
        base.goPrevPage = function() {
            if (o.hashPrefix) { base.updateHashUrl(getPrevPageIndex(base.currentPage)); }
            base.gotoPage('prev');
        };
        /* В разработке */
        base.centerOnCurrentSlide = function() {
            var distToCenter = 3;//Math.ceil(o.visibleCount/2) - 1;
            var threshold    = 1;                               // по одному слайду слева и справа от центрального слайда можно нажимать без переключения ротатора
            var currentPage  = base.currentPage;
            var centerSlide  = currentPage + distToCenter;
            centerSlide = ( centerSlide > (base.items_count-1) || centerSlide < 1) ? Math.abs(base.items_count - Math.abs(centerSlide)) : centerSlide;

            if ( currentPage < (centerSlide - threshold) || currentPage > (centerSlide + threshold)) {
                var page_index = (currentPage > distToCenter) ? (currentPage - distToCenter) : (base.items_count - Math.abs(currentPage - distToCenter));
                base.gotoPage(page_index);
            }
        };
        base.rotateItems = function(targetpage) {
            if (targetpage) {
                var slidingDiff = targetpage - $(base.items.slice(o.blocksPerScreen,o.blocksPerScreen+1)).attr("index");
                base.items = rotateArray( base.items, slidingDiff );
            }
        };

        // Adjust slider dimensions on parent element resize
        base.checkResize = function(stopTimer) {
            clearTimeout(base.resizeTimer);
            base.resizeTimer = setTimeout(function() {
                var containerWidthCalc = base.$container.find(o.itemsSelector).first().width() * o.blocksPerScreen * 4,
                    containerWidthFact = base.$container.outerWidth(),
                    threshold          = 10; //на столько пикселей могут отличаться расчетная ширина и фактическая

                if (containerWidthCalc > containerWidthFact+threshold ||
                    containerWidthCalc < containerWidthFact-threshold) {
                    base.$items.css("width",containerWidthFact / (4*o.blocksPerScreen) );
                }
                if (typeof(stopTimer) === 'undefined'){ base.checkResize(); }
            }, 750);
        };
        function getPrevPageIndex(page_index) {
            return (page_index > 1) ? (page_index - 1) : base.page_count;
        }
        function getNextPageIndex(page_index) {
            return (page_index < base.page_count) ? (page_index + 1) : 1;
        }
        function rotateArray(arr, n) {
            return arr.slice(n, arr.length).concat(arr.slice(0, n));
        }
        // Trigger the initialization
        base.init();
    };

    $.rotator2.defaults = {
        itemsSelector:       ".b-rotator__item",        // Селектор для слайдов
        prev:                ".b-rotator__prev",    // Селектор кнопки "Назад"
        next:                ".b-rotator__next",    // Селектор кнопки "Вперед"

        blocksPerScreen:     1,         // Сколько блоков влазит на один экран
        blocksChangePerPage: 1,         // На сколько блоков передвигается ротатор при переключении на 1 страницу
        duration:            1000,      // Скорость прокрутки одного слайда
        easing:              "swing",   // Эффекты переходов кроме "linear" или "swing" (т.е. нестандартные) требуют для работы easing-плагин

        navSelector:         '.b-rotator__paging',      // Селектор для навигационного бара
        navDrawPageNumber:   false,     // Рисовать ли на кнопках нав. бара номера страниц
        navPageTemplate:     '<a href="#$n"><span>$i</span></a>', // Шаблон для кнопки в навигаторе
        keyboardNavigation:  false,     // Переключение слайдов по стрелкам клавиатуры. Больше одного на страницу врядли стоит делать.

        onBeforeAnimation:   false,     // Функция, вызываемая прямо перед анимацией
        onMoveComplete:      false,     // Функция, вызываемая после завершения анимации переключения слайдов

        autoPlay:            false,     // Режим слайдшоу
        delay:               6000,      // Задержка между переключениями слайдов в режиме слайдшоу (без учета duration)
        pauseOnHover:        false,     // Ставить ротатор на паузу, когда мышь над ним. На айпаде нет ховера!

        useSwipeTouch:       false,     // Прокрутка слайдов по тачпадовским жестам.
        hashPrefix:          false,     // Хэш на который ротатор будет отзываться, если указан
        lazyLoad:            false,     // Загружать только слайд на который переходим, раньше работал только для 1 картинки на слайд

        startPage:           1,         // C какой страницы начинать отображать слайдер
        autoWidthCheck:      "opera",   // Слайдер будет расчитывать ширину слайдов в пикселях (спешал фор Опера)
        containerOverflow:   "hidden"
    };
    $.fn.rotator2 = function(options) {
        // init slider
        if ((typeof(options)).match('object|undefined')) {
            return this.each(function() {
                (new $.rotator2(this, options));
            });
        // If options is a number, process as an external link to page #: $(element).rotator2(#)
        } else if (/\d/.test(options) && !isNaN(options)) {
            return this.each(function() {
                var rotator = $.data(this, 'rotator');
                if (rotator) {
                    var page = (typeof(options) == "number") ? options : parseInt($.trim(options),10);
                    if ( page < 1 || page > founded_rotator.items_count ) { return; }
                    rotator.gotoPage(page);
                }
            });
        }
    };
})(jQuery);

$(document).ready(function() {
    var rotatorsWithData = $(".b-rotator-data");
    rotatorsWithData.each(function() {
        var self = $(this);
        var dataOptions = {
            itemsSelector:       self.data('items'),
            prev:                self.data('prev'),
            next:                self.data('next'),
            blocksPerScreen:     self.data('perscreen'),
            blocksChangePerPage: self.data('perpage'),
            duration:            self.data('duration'),
            easing:              self.data('easing'),
            navSelector:         self.data('nav'),
            navDrawPageNumber:   self.data('navpagenumber'),
            navPageTemplate:     self.data('navtemplate'),
            keyboardNavigation:  self.data('keyboard'),
            onBeforeAnimation:   self.data('before'),
            onMoveComplete:      self.data('complete'),
            autoPlay:            self.data('auto'),
            delay:               self.data('delay'),
            pauseOnHover:        self.data('pauseonhover'),
            useSwipeTouch:       self.data('swipe'),
            hashPrefix:          self.data('hash'),
            lazyLoad:            self.data(''),
            startPage:           self.data('start'),
            autoWidthCheck:      self.data('widthcheck')
        };
        self.rotator2(dataOptions);
    });
});
