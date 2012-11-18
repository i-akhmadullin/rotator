/*
* Получение номера страницы, на котором находится слайдер:
*  var current = $('#slider1').data('rotator').currentPage; // возвращает номер страницы #
*
* Переключение на слайд (внешняя ссылка):
*  <a href='#' id='slide-jump'>Slide 4</a>
*  $('#slide-jump').click(function(){
*    $('#slider2').rotator2(4);
*  });
*
*  Управление режимом слайдшоу
*  $('#slider1').data('rotator').goNextPage(); // переключить на след слайд
*  $('#slider1').data('rotator').goPrevPage(); // вернутся на пред слайд
*/
;(function ($) {
    'use strict';
    /**
    * @constructor
    */
    $.rotator2 = function(el, options) {

        var base = this, o; // o - это настройки
        base.$el = $(el);

        base.currentPage = 1;
        base.timer       = null;    // Таймер, автоматически переключает слайды
        base.animating   = false;   // Индикатор того, что ротатор в процессе анимации между слайдами
        base.playing     = false;   // Внутренний индикатор активности режима слайдшоу
        base.items       = [];      // Массив слайдов

        base.init = function() {
            if (base.$el.data('rotator')) {
                return false;
            }
            base.$el.data('rotator', base);

            base.options = o = $.extend({},$.rotator2.defaults, options);
            if (o.blocksChangePerPage > o.blocksPerScreen) { o.blocksChangePerPage = o.blocksPerScreen; }

            base.$items = base.$el.find(o.itemsSelector);
            base.items  = base.$items.toArray();

            base.itemsCount       = base.$items.length;
            base.containerName     = 'b-rotator__container';                            // В контейнер с таким классом будут обёрнуты все слайды
            base.containerSelector = '.' + base.containerName;
            base.afterAnimateCss = { 'margin-left': '-100%', 'left': '0%' };
            base.wrapper = base.$el.closest('.b-rotator-wrapper');


            var buttonsArray = [];
            if (o.prev) { buttonsArray.push(o.prev); }
            if (o.next) { buttonsArray.push(o.next); }
            o.buttonsSelector = buttonsArray.join(', ');

            if (o.blocksPerScreen > o.itemsCount) { o.blocksPerScreen = base.itemsCount; }
            if (!$.isFunction( $.easing[o.easing] )) { o.easing = 'swing'; }

            base.pageCount = Math.ceil(base.itemsCount / o.blocksChangePerPage);         // кол-во страниц слайдера = кол-во слайдов / сколько менять за 1 экран
            base.blockCount = Math.ceil(base.itemsCount / o.blocksPerScreen) + 1;        // кол-во блоков = кол-во слайдов / сколько влазит на страницу
            base.containerWidth = 100 * 4;
            base.itemsWidth = 100 / (4 * o.blocksPerScreen);

            base.$items.each(function (i) { $(this).data('index', i + 1).attr('index', i + 1); })
                .css('width', base.itemsWidth + '%')
                .wrapAll('<div style="width: ' + base.containerWidth+'%;' + '" class="'+base.containerName+'"/>');
            base.$container = base.$el.find(base.containerSelector);
            base.$el.css('overflow', o.containerOverflow);
            /*base.$el.parent().prepend( $("<a href=\"#\"><span>&nbsp;</span></a>").addClass("RotatorPrevLink"),
                $("<a href=\"#\"><span>&nbsp;</span></a>").addClass("RotatorNextLink"));*/

            if (base.pageCount > 3) {   // сдвигаем массив слайдов так чтобы вначале стояли слайды с последней страницы
                base.rotateItems(o.startPage);
                base.refreshSlider();
                base.$container.css({ 'margin-left': -base.itemsWidth * 4 * o.blocksPerScreen + '%' });
            }

            if (base.itemsCount <= o.blocksPerScreen) {
                base.$el.addClass('b-rotator-not-enough-slides');
                base.wrapper.find(o.buttonsSelector).hide();
                base.wrapper.find(o.navSelector).hide();
            } else {
                base.buildNextPrevButtons();
                if (o.navSelector && base.pageCount > 1) {
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
                if(o.autoWidthCheck === 'opera') {
                    if(isOpera) { base.checkResize(); }
                } else { base.checkResize(); }
            }
        };

        base.addHashChangeListener = function() {
            $(window).bind('hashchange', function(e) {
                var page = e.getState(o.hashPrefix, true) || 1;
                base.gotoPage(page);
            });
        };
        base.addSwipeTouchListener = function() {
            $(this).bind({
                'swipeleft': function () {
                    base.goNextPage();
                },
                'swiperight': function () {
                    base.goPrevPage();
                }
            });
        };
        base.addKeyboardListener = function() {
            $(document).keydown(function(e) {
                if (e.which === 37) {
                    base.goPrevPage();
                } else if (e.which === 39) {
                    base.goNextPage();
                }
            });
        };
        base.addOnHoverListener = function() {
            var rotatorArea = [];              // ротатор + next + prev + navigation
            rotatorArea.push(base);
            if (o.prev) { rotatorArea.push(o.prev); }
            if (o.next) { rotatorArea.push(o.next); }
            if (o.navSelector) { rotatorArea.push(o.navSelector); }
            $(rotatorArea.join(', ')).hover(
                function() { base.clearTimer(); },
                function() { base.startStop(); } );
        };
        base.buildNavigation = function() {
            var pageCount = base.pageCount,
                pagesInPage, changeCount,
                navigation = base.wrapper.find(o.navSelector);
            for (var i = 0; i < pageCount; i++) {
                pagesInPage = [];
                changeCount = o.blocksChangePerPage;
                for (var j = i * changeCount + 1; j < ((i + 1) * changeCount + 1); j++) {
                    pagesInPage.push(j);
                }
                var navLink = $(o.navPageTemplate.replace('$i', (i + 1))).data('page', i).data('items', pagesInPage);
                if (o.hashPrefix) { navLink.attr('href', '#' + o.hashPrefix + '=' + (i + 1)); }
                if (o.navDrawPageNumber) { navLink.text(i + 1); }
                navigation.append(navLink);
            }
            navigation.find('a').first().addClass('Active');
            navigation.delegate('a', 'click', function () {
                var self = $(this);
                if (base.animating || self.hasClass('Active')) { return false; }
                var targetPage = self.data('items')[0];
                var pageIndex = (targetPage-1)/o.blocksChangePerPage + 1;

                navigation.not(self).removeClass('Active');
                self.addClass('Active');
                if (o.hashPrefix) { base.updateHashUrl(targetPage); }
                base.gotoPage(pageIndex);
                return false;
            });
        };
        base.buildNextPrevButtons = function() {
            if (o.hashPrefix) { base.updateNextPrevLinks(); }
            base.wrapper.find(o.buttonsSelector).css('visibility', 'visible').click(function () {
                if ($(this).is(o.prev)) {
                    base.goPrevPage();
                } else {
                    base.goNextPage();
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
                    base.goNextPage();
                }, o.delay + o.duration);
            } else {
                base.clearTimer();
            }
        };
        base.clearTimer = function() {
            if (base.timer) { clearTimeout(base.timer); base.timer = null; }        // Обнуляем таймер, если он был установлен
        };
        /* Обновляет хэш адресной строки: префикс_ротатора=targetPage */
        base.updateHashUrl = function(targetPage) {
            var state = {};
            state[o.hashPrefix] = targetPage;
            $.bbq.pushState(state);
        };

        /* Обновляет хэши у кнопок вперед/назад */
        base.updateNextPrevLinks = function() {
            var prevIndex = getPrevPageIndex(base.currentPage),
                nextIndex = getNextPageIndex(base.currentPage);
            $(o.prev).attr('href', '#' + o.hashPrefix + '=' + prevIndex);
            $(o.next).attr('href', '#' + o.hashPrefix + '=' + nextIndex);
        };

        /* Переход на страницу с указанным индексом и prev/next - перейти на пред/след страницу */
        base.gotoPage = function(endIndex) {
            if (base.animating || base.currentPage === endIndex) { return; }
            base.animating = true;
            base.clearTimer();
            base.wrapper.find(o.navSelector).find('a').eq(endIndex-1).addClass('Active');

            var valueRight, step, isPrev, marginLeft,
                rotatorContainer = base.$container,
                startIndex       = base.currentPage;

            // if (endIndex == 'prev' || endIndex == 'next') {
            //     step      = o.blocksChangePerPage;
            //     isPrev   = (endIndex == 'prev');
            //     endIndex = parseInt( isPrev ? getPrevPageIndex(startIndex) : getNextPageIndex(startIndex), 10);
            // } else {
                step         = Math.abs(startIndex - endIndex) * o.blocksChangePerPage;
                step         = (step > base.itemsCount / 2) ? base.itemsCount - step : step;
                valueRight  = ((startIndex-1)*o.blocksChangePerPage + 1 + step) % base.itemsCount;
                valueRight  = (valueRight === 0) ? base.itemsCount : valueRight;
                isPrev      = (valueRight !== (endIndex-1)*o.blocksChangePerPage+1);
                if (step === base.itemsCount / 2) { isPrev = false; }
                endIndex    = parseInt(endIndex, 10);
            // }
            base.nextPage = endIndex;
            if (isPrev && step > o.blocksPerScreen) {      // будут "пропущены" слайды между экранами
                rotatorContainer.find(o.itemsSelector).slice(-o.blocksPerScreen).remove();
                base.rotateItems((endIndex-1)*o.blocksChangePerPage+1);

                var slidesToAdd = base.items.slice(o.blocksPerScreen, 2*o.blocksPerScreen);
                if (slidesToAdd.length === o.blocksPerScreen) {
                    rotatorContainer.prepend(slidesToAdd);
                    var notEnoughSlides = 3*o.blocksPerScreen - rotatorContainer.find(o.itemsSelector).length;
                    if (notEnoughSlides > 0) {
                        rotatorContainer.prepend(base.items.slice(o.blocksPerScreen-notEnoughSlides,2*o.blocksPerScreen-notEnoughSlides));
                    }
                }
                var extraBlocks = 3*o.blocksPerScreen - rotatorContainer.find(o.itemsSelector).length;
                rotatorContainer.css('margin-left', -200-100*(extraBlocks/o.blocksPerScreen) + '%');
            } else if (!isPrev && step > 2*o.blocksPerScreen-1) {      // будут "пропущены" слайды между экранами
                base.rotateItems((endIndex-1)*o.blocksChangePerPage+1);
                rotatorContainer.find(o.itemsSelector).slice(0, o.blocksPerScreen).remove();

                rotatorContainer.append(base.items.slice(o.blocksPerScreen, 2*o.blocksPerScreen));
                rotatorContainer.css('margin-left', 0 + '%');
            } else if (!isPrev && step > o.blocksPerScreen && step <= 2*o.blocksPerScreen) {
                base.rotateItems((endIndex-1)*o.blocksChangePerPage+1);
                var blocksToDel = Math.abs(step) % o.blocksPerScreen;

                var toDel = rotatorContainer.find(o.itemsSelector).slice(0, blocksToDel);
                rotatorContainer.find(o.itemsSelector).slice(0, blocksToDel).remove();
                rotatorContainer.append( toDel );

                marginLeft = -100 + (isPrev ? -100 : 100)*(blocksToDel/o.blocksPerScreen);
                rotatorContainer.css('margin-left', marginLeft + '%');
            } else {    // слайдимся по обычному
                base.rotateItems((endIndex-1)*o.blocksChangePerPage+1);
                base.refreshSlider();

                marginLeft = -100 + (isPrev ? -100 : 100)*(step/o.blocksPerScreen);
                rotatorContainer.css('margin-left', marginLeft + '%');
            }
            if (o.onBeforeAnimation && typeof(o.onBeforeAnimation) === 'function') {
                o.onBeforeAnimation(base.nextPage);
            }

            base.animateRotator(startIndex, step, isPrev);
            base.startStop();
        };

        base.animateRotator = function(startIndex, step, isPrev) {
            var animationStep = Math.min(step, 2*o.blocksPerScreen);
            var moveBy = animationStep * 100 / o.blocksPerScreen,
                containerShift = ((isPrev) ? '+' : '-') + '=' + moveBy + '%';

            base.$container.animate({ left: containerShift}, {
                duration: o.duration,
                easing: o.easing,
                complete: function () {
                    base.onAnimationComplete();
                }
            });
        };

        base.onAnimationComplete = function() {
            var rotatorContainer = base.$container,
                $navlinks = base.wrapper.find(o.navSelector).find('a');

            base.refreshSlider();
            rotatorContainer.css(base.afterAnimateCss);

            base.rotateItems(base.nextPage*o.blocksChangePerPage);
            base.currentPage = base.nextPage;

            if (o.navSelector) { $navlinks.removeClass('Active').eq(base.currentPage - 1).addClass('Active'); }
            if (o.hashPrefix) { base.updateNextPrevLinks(); }
            base.animating = false;
            if (o.onMoveComplete && typeof(o.onMoveComplete) === 'function') {
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
        };
        base.goNextPage = function() {
            var nextPageIndex = getNextPageIndex(base.currentPage);
            if (o.hashPrefix) { base.updateHashUrl( nextPageIndex ); }
            base.gotoPage( nextPageIndex );
        };
        base.goPrevPage = function() {
            var prevPageIndex = getPrevPageIndex(base.currentPage);
            if (o.hashPrefix) { base.updateHashUrl( prevPageIndex ); }
            base.gotoPage( prevPageIndex );
        };
        /* В разработке */
        base.centerOnCurrentSlide = function() {
            var distToCenter = 3;//Math.ceil(o.visibleCount/2) - 1;
            var threshold    = 1;                               // по одному слайду слева и справа от центрального слайда можно нажимать без переключения ротатора
            var currentPage  = base.currentPage;
            var centerSlide  = currentPage + distToCenter;
            centerSlide = ( centerSlide > (base.itemsCount-1) || centerSlide < 1) ? Math.abs(base.itemsCount - Math.abs(centerSlide)) : centerSlide;

            if ( currentPage < (centerSlide - threshold) || currentPage > (centerSlide + threshold)) {
                var pageIndex = (currentPage > distToCenter) ? (currentPage - distToCenter) : (base.itemsCount - Math.abs(currentPage - distToCenter));
                base.gotoPage(pageIndex);
            }
        };
        base.rotateItems = function(targetPage) {
            var slidesToAddAmount = 3 * o.blocksPerScreen - base.items.length;
            var slidesToAdd = base.items.slice(0, slidesToAddAmount);
            if (targetPage) {
                var slidingDiff = targetPage - $(base.items.slice(o.blocksPerScreen,o.blocksPerScreen+1)).attr('index');
                base.items = rotateArray( base.items, slidingDiff );
            }
            if (slidesToAddAmount > 0) {
                $(slidesToAdd).clone().appendTo(base.$container);
            }
        };

        base.checkResize = function() {
            clearTimeout(base.resizeTimer);
            base.resizeTimer = setTimeout(function() {
                var containerWidthCalc = base.$container.find(o.itemsSelector).first().width() * o.blocksPerScreen * 4,
                    containerWidthFact = base.$container.outerWidth(),
                    threshold          = 10; //на столько пикселей могут отличаться расчетная ширина и фактическая

                if (containerWidthCalc > containerWidthFact+threshold ||
                    containerWidthCalc < containerWidthFact-threshold) {
                    base.$items.css('width',containerWidthFact / (4*o.blocksPerScreen) );
                }
            }, 750);
        };

        base.init();

        function getPrevPageIndex(pageIndex) {
            return (pageIndex > 1) ? (pageIndex - 1) : base.pageCount;
        }
        function getNextPageIndex(pageIndex) {
            return (pageIndex < base.pageCount) ? (pageIndex + 1) : 1;
        }
        function rotateArray(arr, n) {
            return arr.slice(n, arr.length).concat(arr.slice(0, n));
        }
    };

    $.rotator2.defaults = {
        itemsSelector:       '.b-rotator__item',    // Селектор для слайдов
        prev:                '.b-rotator__prev',    // Селектор кнопки "Назад"
        next:                '.b-rotator__next',    // Селектор кнопки "Вперед"

        blocksPerScreen:     1,         // Сколько блоков влазит на один экран
        blocksChangePerPage: 1,         // На сколько блоков передвигается ротатор при переключении на 1 страницу
        duration:            1000,      // Скорость прокрутки одного слайда
        easing:              'swing',   // Эффекты переходов кроме "linear" или "swing" (т.е. нестандартные) требуют для работы easing-плагин
        startPage:           1,         // C какой страницы начинать отображать слайдер

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

        autoWidthCheck:      'opera',   // Слайдер будет расчитывать ширину слайдов в пикселях (спешал фор Опера)
        containerOverflow:   'hidden'
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
                    var page = (typeof(options) === 'number') ? options : parseInt($.trim(options),10);
                    if ( page < 1 || page > rotator.itemsCount ) { return; }
                    rotator.gotoPage(page);
                }
            });
        }
    };
})(jQuery);

$(document).ready(function() {
    'use strict';
    var rotatorsWithData = $('.b-rotator-data');
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