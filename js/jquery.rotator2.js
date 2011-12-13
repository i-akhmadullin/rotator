/*
* Получение номера страницы, на котором находится слайдер:
*  var current = $('#slider1').data('rotator_link').currentPage; // возвращает номер страницы #
*
* Переключение на слайд (внешняя ссылка):
*  <a href="#" id="slide-jump">Slide 4</a>
*  $("#slide-jump").click(function(){
*    $('#slider2').rotator2(4);
*  });
*
*  Управление режимом слайдшоу
*  $('#slider1').data('rotator_link').goNextPage();			// переключить на след слайд
*  $('#slider1').data('rotator_link').goPrevPage();			// вернутся на пред слайд
*/
;Array.prototype.rotate = (function() {
	var push = Array.prototype.push, splice = Array.prototype.splice;
	return function(count) {
		var len = this.length >>> 0, // convert to uint
			count = count >> 0; // convert to int
		// convert count to value in range [0, len[
		count = ((count % len) + len) % len;
		push.apply(this, splice.call(this, 0, count));
		return this;
	};
})();
allowBreakpoints = false;

;(function ($) {
	$.rotator2 = function(el, options) {

		var base = this, o; // o - это настройки
		base.$el = $(el);
		base.$el.data("rotator_link", base);

		base.currentPage = 1;
		base.timer       = null;				// Таймер, автоматически переключает слайды
		base.animating   = false;				// Индикатор того, что ротатор в процессе анимации между слайдами
		base.playing     = false;				// Внутренний индикатор активности режима слайдшоу
		base.items       = [];					// Массив слайдов

		base.init = function() {

			base.options = o = $.extend({},$.rotator2.defaults, options);
			if (o.blocksChangePerPage > o.blocksPerScreen) { o.blocksChangePerPage = o.blocksPerScreen; }

			base.$items = base.$el.find(o.itemsSelector);
			base.items  = base.$items.toArray();

			base.items_count       = base.$items.length;
			base.containerName     = "RotatorContainer";											// В контейнер с таким классом будут обёрнуты все слайды
			base.containerSelector = "." + base.containerName;										// Селектор для контейнера
			base.after_animate_css = { 'margin-left': "-100%", 'left': 0 };

			var buttons_array = [];
			if (o.prev) { buttons_array.push(o.prev); }
			if (o.next) { buttons_array.push(o.next); }
			o.buttons_selector = buttons_array.join(', ');		// объединили CSS-селекторы кнопок "вперед" и "назад" в единый селектор

			if (o.blocksPerScreen > o.items_count) { o.blocksPerScreen = base.items_count; }
			if (!$.isFunction( $.easing[o.easing] )) { o.easing = "swing"; }

			base.page_count = Math.ceil(base.items_count / o.blocksChangePerPage);							// кол-во страниц слайдера = кол-во слайдов / сколько менять за 1 экран
			base.block_count = Math.ceil(base.items_count / o.blocksPerScreen) + 1;					// кол-во блоков = кол-во слайдов / сколько влазит на страницу
			base.container_width = 100 * 4;
			base.items_width = 100 / (4 * o.blocksPerScreen);

			base.$items.each(function (i) { $(this).data('index', i + 1).attr("index", i + 1); })
					   .css('width', base.items_width + '%')
					   .wrapAll('<div style="width: ' + base.container_width + '%;' + '" class="' + base.containerName + '" />');
			base.$container = base.$el.children(base.containerSelector);

			if(base.page_count > 3) {		// сдвигаем массив слайдов так чтобы вначале стояли слайды с последней страницы
				base.cycleItems(-o.blocksPerScreen);
				base.$container.find(o.itemsSelector).remove();										// убираем в память все слайды
				base.$container.append(base.items.slice(0, 3*o.blocksPerScreen));				// добавляем слайдов только на три страницы
				base.$container.css({ 'margin-left': -base.items_width * 4 * o.blocksPerScreen + '%' });
			}

			if (base.items_count <= o.blocksPerScreen) {
				base.$el.addClass("static-rotator");
				$(o.buttons_selector).hide();
				$(o.navSelector).hide();
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
		};

		/* Обработчик изменения хэша страницы */
		base.addHashChangeListener = function() {
			$(window).bind("hashchange", function(e) {
				var page = e.getState(o.hashPrefix, true) || 1;
				if (!base.animating) {
					base.gotoPage('' + page);
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
			var rotator_area = [];				// ротатор + next + prev + navigation
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
			var page_count = base.page_count;	// выделил в отдельную переменную, чтобы в цикле не пересчитывалось
			var pages_in_page, changeCount;
			for (var i = 0; i < page_count; i++) {
				pages_in_page = [];
				changeCount = o.blocksChangePerPage;
				for (var j = i * changeCount + 1; j < ((i + 1) * changeCount + 1); j++) {
					pages_in_page.push(j);
				}
				var nav_link = $(o.navPageTemplate.replace("$i", (i + 1))).data('page', i).data('items', pages_in_page).attr("title", "Нажмите для перехода на слайд "+(i+1));
				if (o.hashPrefix) { nav_link.attr("href", "#" + o.hashPrefix + "=" + (i + 1)); }
				if (o.navDrawPageNumber) { nav_link.text(i + 1); }
				$(o.navSelector).append(nav_link);
			}
			$(o.navSelector).find('a').first().addClass('Active');
			$(o.navSelector).delegate('a', 'click', function () {
				if (base.animating || $(this).hasClass('Active')) {	return false; }
				var target_page = $(this).data('items')[0];
				$(this).addClass('Active').siblings().removeClass('Active');
				if (o.hashPrefix) {
					base.updateHashUrl(target_page);
				}
				base.gotoPage(target_page);
				return false;
			});
		};
		/* Инициализация кнопок вперед/назад */
		base.buildNextPrevButtons = function() {
			if (o.hashPrefix) {	base.updateNextPrevLinks();	}
			base.$el.parent().find(o.buttons_selector).click(function () {
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
			} else {
				base.clearTimer();
			}
		};
		base.clearTimer = function() {
			if (base.timer) { clearTimeout(base.timer); }			// Обнуляем таймер, если он был установлен
		};
		/* Обновляет хэш адресной строки: префикс_ротатора=target_page */
		base.updateHashUrl = function(target_page) {
			var state = {};
			state[o.hashPrefix] = target_page;
			$.bbq.pushState(state);
		};

		/* Обновляет хэши у кнопок вперед/назад */
		base.updateNextPrevLinks = function() {
			var prev_index = getPrevPageIndex(base.currentPage, base.items_count),
				next_index = getNextPageIndex(base.currentPage, base.items_count);
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
		/* Переход на страницу с указанным индексом и prev/next - перейти на пред/след страницу	*/
		base.gotoPage = function(end_index) {
			if (base.animating || base.currentPage == end_index) { return; }
			base.animating = true;
			base.clearTimer();

			var value_right, step, is_prev,
				need_rotators, next_rotators,
				notFittedSlides   = null,
				rotator_container = base.$container,
				start_index       = base.currentPage,
				current_rotator   = rotator_container.find(o.itemsSelector).filter(function() { return $(this).data("index") == start_index });

			if (end_index == 'prev' || end_index == 'next') {
				step    = o.blocksChangePerPage;
				is_prev = (end_index == 'prev');
				end_index = parseInt( is_prev ? getPrevPageIndex(start_index, base.items_count) : getNextPageIndex(start_index, base.items_count), 10);
			} else {
				end_index = parseInt(end_index, 10);
				step         = Math.abs(start_index - end_index);
				step         = (step > base.items_count / 2) ? base.items_count - step : step;
				value_right  = (start_index + step) % base.items_count;
				value_right  = (value_right == 0) ? base.items_count : value_right;
				is_prev      = (value_right != end_index);
				if (step == base.items_count / 2) { is_prev = false; }
			}
			base.nextPage = end_index;
			if (is_prev && step > o.blocksPerScreen) {		// будут "пропущены" слайды между экранами
				rotator_container.find(o.itemsSelector).slice(-o.blocksPerScreen).remove();
				base.cycleItems(null, end_index);

				var slidesToAdd = base.items.slice(o.blocksPerScreen, 2*o.blocksPerScreen);
				if (slidesToAdd.length == o.blocksPerScreen) {
					rotator_container.prepend(slidesToAdd);
					var notEnoughSlides = 3*o.blocksPerScreen - rotator_container.find(o.itemsSelector).length;
					if (notEnoughSlides > 0) {
						console.log(notEnoughSlides);
						rotator_container.prepend(base.items.slice(o.blocksPerScreen-notEnoughSlides,2*o.blocksPerScreen-notEnoughSlides));
					}
					if (allowBreakpoints) debugger;
				}
				rotator_container.css('margin-left', -200 + '%');
			} else if (!is_prev && step > 2*o.blocksPerScreen-1) {		// будут "пропущены" слайды между экранами
				base.cycleItems(null, end_index);
				rotator_container.find(o.itemsSelector).slice(0, o.blocksPerScreen).remove();

				rotator_container.append(base.items.slice(o.blocksPerScreen, 2*o.blocksPerScreen));
				rotator_container.css('margin-left', 0 + '%');
				if (allowBreakpoints) debugger;
			} else if (!is_prev && step > o.blocksPerScreen && step <= 2*o.blocksPerScreen) {
				base.cycleItems( null, end_index );
				var blocksToDel = Math.abs(step) % o.blocksPerScreen;
				marginLeft = -100 + (is_prev ? -100 : 100)*(blocksToDel/o.blocksPerScreen);

				rotator_container.find(o.itemsSelector).slice(0, blocksToDel).remove();
				rotator_container.append(base.items.slice(o.blocksPerScreen, 2*o.blocksPerScreen));

				rotator_container.css('margin-left', marginLeft + '%');
			} else {	// слайдимся по обычному
				var marginLeft;
				base.cycleItems( null, end_index );
				marginLeft = -100 + (is_prev ? -100 : 100)*(step/o.blocksPerScreen);

				rotator_container.find(o.itemsSelector).remove();
				rotator_container.append(base.items.slice(0, 3 * o.blocksPerScreen));

				rotator_container.css('margin-left', marginLeft + '%');
				if (allowBreakpoints) debugger;
			}
			if (o.onBeforeAnimation && typeof(o.onBeforeAnimation) == 'function') {
				o.onBeforeAnimation(current_page);
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
					base.onAnimationComplete(is_prev, step);
				}
			});
		};
		base.onAnimationComplete = function(is_prev, step) {
			var rotator_container = base.$container,
				$navlinks = $(o.navSelector).find('a');

			rotator_container.find(o.itemsSelector).remove();
			var slides = base.items.slice(0, 3*o.blocksPerScreen);
			rotator_container.append(slides).css(base.after_animate_css);

			base.cycleItems(null, base.nextPage);
			base.currentPage = base.nextPage;

			var current_page = base.currentPage;
			if (o.navSelector) { $navlinks.removeClass('Active').eq(current_page-1).addClass("Active"); }
			if (o.hashPrefix) { base.updateNextPrevLinks(); }
			base.animating = false;
			if (o.onMoveComplete && typeof(o.onMoveComplete) == 'function') {
				o.onMoveComplete(current_page);
			}
		};

		base.goNextPage = function() {
			if (o.hashPrefix) { base.updateHashUrl(getNextPageIndex(base.currentPage, base.items_count)); }
			base.gotoPage('next');
		};
		base.goPrevPage = function() {
			if (o.hashPrefix) {	base.updateHashUrl(getPrevPageIndex(base.currentPage, base.items_count)); }
			base.gotoPage('prev');
		};
		/* В разработке */
		base.centerOnCurrentSlide = function() {
			var distToCenter = 3;//Math.ceil(o.visibleCount/2) - 1;
			var threshold = 1;									// по одному слайду слева и справа от центрального слайда можно нажимать без переключения ротатора
			var currentPage = base.currentPage;
			var centerSlide = currentPage + distToCenter;
			centerSlide = ( centerSlide > (base.items_count-1) || centerSlide < 1) ? Math.abs(base.items_count - Math.abs(centerSlide)) : centerSlide;

			if ( currentPage < (centerSlide - threshold) || currentPage > (centerSlide + threshold)) {
				var page_index = (currentPage > distToCenter) ?	(currentPage - distToCenter) : (base.items_count - Math.abs(currentPage - distToCenter));
				base.gotoPage('' + page_index);
			}
		};
		base.cycleItems = function(diff, targetpage) {
			if (targetpage) {
				var slidingDiff = targetpage - $(base.items.slice(o.blocksPerScreen,o.blocksPerScreen+1)).attr("index");
				base.items.rotate(slidingDiff);
			}
		}

		// Trigger the initialization
		base.init();
	};

	$.rotator2.defaults = {
		itemsSelector: '.RotatorItem',	// Селектор слайдов
		prev: null,						// Селектор кнопки "Назад"
		next: null,						// Селектор кнопки "Вперед"

		blocksPerScreen: 1,				// Сколько блоков влазит на один экран
		blocksChangePerPage: 1,			// На сколько блоков передвигается ротатор при переключении на 1 страницу
		duration: 1000,					// Скорость прокрутки одного слайда
		easing: "swing",				// Эффекты переходов кроме "linear" или "swing" (т.е. нестандартные) требуют для работы easing-плагин

		navSelector: null,				// Селектор для навигационного бара
		navDrawPageNumber: false,		// Рисовать ли на кнопках нав. бара номера страниц
		navPageTemplate: '<a href="#$n"><span>$i</span></a>', // Шаблон для кнопки в навигаторе
		keyboardNavigation: false,		// Переключение слайдов по стрелкам клавиатуры. Больше одного на страницу врядли стоит делать.

		onBeforeAnimation: false,		// Функция, вызываемая прямо перед анимацией
		onMoveComplete: false, 			// Функция, вызываемая после завершения анимации переключения слайдов

		autoPlay: false,				// Режим слайдшоу
		delay: 6000, 					// Задержка между переключениями слайдов в режиме слайдшоу (без учета duration)
		pauseOnHover: false,			// Ставить ротатор на паузу, когда мышь над ним. На айпаде нет ховера!

		useSwipeTouch: false,			// Прокрутка слайдов по тачпадовским жестам.
		hashPrefix: false,				// Префикс на который ротатор будет отзываться, если указан
		lazyLoad: false, 				// Загружать только слайд на который переходим, раньше работал только для 1 картинки на слайд

		startPage: 1					//TODO C какой страницы начинать отображать слайдер
	};

	function getPrevPageIndex(cur_page_index, page_count) {
		return (cur_page_index > 1) ? (cur_page_index - 1) : page_count;
	}
	function getNextPageIndex(cur_page_index, page_count) {
		return (cur_page_index < page_count) ? (cur_page_index + 1) : 1;
	}
	$.fn.rotator2 = function(options) {
		// init slider
		if ((typeof(options)).match('object|undefined')) {
			return this.each(function() {
				(new $.rotator2(this, options));
			});
		// If options is a number, process as an external link to page #: $(element).anythingSlider(#)
		} else if (/\d/.test(options) && !isNaN(options)) {
			return this.each(function() {
				var founded_rotator = $.data(this,'rotator_link');
				if (founded_rotator) {
					var page = (typeof(options) == "number") ? options : parseInt($.trim(options),10); // accepts "  2  "
					if ( page < 1 || page > founded_rotator.items_count ) { return; }
					founded_rotator.gotoPage(page);
				}
			});
		}
	};
})(jQuery);
