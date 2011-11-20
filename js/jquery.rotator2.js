/*
* Получение номера страницы, на котором находится слайдер:
*
*  var current = $('#slider1').data('rotator_link').currentPage; // возвращает номер страницы #
*
*
* Переключение на слайд (внешняя ссылка):
*
*  <a href="#" id="slide-jump">Slide 4</a>
*
*  $("#slide-jump").click(function(){
*    $('#slider2').rotator2(4);
*  });
*
*
*  Управление режимом слайдшоу
*
*  $('#slider1').data('rotator_link').startStop(true);		// запустить слайдшоу
*  $('#slider2').data('rotator_link').startStop(false);		// остановить слайдшоу
*  $('#slider1').data('rotator_link').goNextPage();			// переключить на след слайд
*  $('#slider1').data('rotator_link').goPrevPage();			// вернутся на пред слайд
*/

;(function ($) {
	$.rotator2 = function(el, options) {

		var base = this;

		base.$el = $(el); //.addClass('');

		// Add a reverse reference to the DOM object
		base.$el.data("rotator_link", base);

		base.currentPage = 1;
		base.timer = null;					// Таймер, автоматически переключает слайды
		base.animating = false;				// Индикатор того, что ротатор в процессе анимации между слайдами
		base.playing = false;				// Внутренний индикатор активности режима слайдшоу

		base.init = function() {

			base.options = $.extend({},$.rotator2.defaults, options);
			if (base.options.changeCount > base.options.visibleCount) {
				base.options.changeCount = base.options.visibleCount;
			}

			// Сохраняем заголовок страницы, чтобы вернутся к нему(в И9 почему-то сбрасывается заголовок при использовании хэшей)
			var title = document.title;

			// Cache existing DOM elements for later
			base.$items = base.$el.find(base.options.items);

			base.items_count = base.$items.length;
			base.containerName = "RotatorContainer";												// В контейнер с таким классом будут обёрнуты все слайды
			base.containerSelector = "." + base.containerName;										// Селектор для контейнера
			base.after_animate_css = { 'margin-left': 0, 'left': 0 };

			base.opera_after_animate_css = { 'margin-left': 0, 'left': '-100%' };					// центруем слайды в ротаторе (для 3х слайдов)

			var buttons_array = [];
			if (base.options.prev) { buttons_array.push(base.options.prev); }
			if (base.options.next) { buttons_array.push(base.options.next); }
			base.options.buttons_selector = buttons_array.join(', ');								// объединили CSS-селекторы кнопок "вперед" и "назад" в единый селектор

			if (base.options.visibleCount > base.options.items_count) { base.options.visibleCount = base.items_count; }
			if (!$.isFunction( $.easing[base.options.easing] )) { base.options.easing = "swing"; }			// Проверяем есть ли указанная анимация

			base.page_count = Math.ceil(base.items_count / base.options.changeCount);				// кол-во страниц слайдера = кол-во слайдов / сколько менять за 1 переключение
			base.block_count = Math.ceil(base.items_count / base.options.visibleCount) + 1;			// кол-во блоков = кол-во слайдов / сколько влазит на страницу
			base.container_width = 100 * base.block_count;											// ширина контейнера = 100*кол-во блоков (переведено в проценты, без знака '%' )
			base.items_width = 100 / (base.block_count * base.options.visibleCount);				// ширина слайдов = 100 / (кол-во блоков*сколько влазит на страницу)

			if (base.operamode) {
				base.block_count = 5;	// в ротаторе помещается 5 страниц: текущая,пред,след, на кот переходим одна из её соседних
				base.container_width = 100 * base.block_count;
				base.items_width = 100 / (base.block_count * base.options.visibleCount);
			}

			base.$items.css('width', base.items_width + '%')
				.wrapAll('<div style="width: ' + base.container_width + '%;' + '" class="' + base.containerName + '" />')	// оборачиваем все слайды в контейнер
				.each(function (i) { $(this).data('index', i + 1); });								// в каждый слайд сохраняем его порядковый номер
			base.$container = base.$el.children(base.containerSelector);							// контейнер = обертка слайдов

			// base.settings = settings;

			if (base.operamode) {
				base.$items.slice(3 * base.options.visibleCount,base.items_count).hide(); // Оставляем блоки только с первых трех страниц
			}

			if (base.items_count <= base.options.visibleCount) {
				$(base.options.buttons_selector).hide();
				$(base.options.navigation).hide();
			} else {
				base.buildNextPrevButtons();
				if (base.options.navigation && base.page_count > 1) {
					base.buildNavigation();
				}
				if (base.options.useSwipeTouch) {
					base.addSwipeTouchListener();
				}
				if (base.options.keyboardNavigation) {
					base.addKeyboardListener();
				}
				if (base.options.autoPlay) {
					base.playing = true;
					//wrapper.rotator('buildAutoPlay');
					base.startStop();
				}
				if (base.options.pauseOnHover) {
					base.addOnHoverListener();
				}
				if (base.options.hashPrefix) {
					base.addHashChangeListener(title);
					$(window).trigger('hashchange');	// проверка на наличие хэша при загрузке страницы
				}
			}
		};

		/* Обработчик изменения хэша страницы */
		base.addHashChangeListener = function(title) {
			$(window).bind("hashchange", function(e) {
				var page = e.getState(base.options.hashPrefix, true) || 1;
				if (!base.animating) {
					//document.title = title;
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
			// next + prev + settings.navigation
			var rotator_area = [];
			if (base.options.prev) { rotator_area.push(base.options.prev); }
			if (base.options.next) { rotator_area.push(base.options.next); }
			if (base.options.navigation) { rotator_area.push(base.options.navigation); }
			base.hover(
				function() { base.clearTimer(); },
				function() { base.startStop(); } );
			$(rotator_area.join(', ')).hover(
				function() { base.clearTimer(); },
				function() { base.startStop(); } );
		};
		/* Инициализация навигационной панели */
		base.buildNavigation = function() {
			var page_count = base.page_count;	// выделил в отдельную переменную, чтобы в цикле не пересчитывалось
			for (var i = 0; i < page_count; i++) {
				var pages_in_page = [];
				var changeCount = base.options.changeCount;
				for (var j = i * changeCount + 1; j < ((i + 1) * changeCount + 1); j++) {
					pages_in_page.push(j);
				}
				var nav_link = $(base.options.navPageTemplate.replace("$i", (i + 1))).data('page', i).data('items', pages_in_page).attr("title", "Нажмите для перехода на слайд "+(i+1));
				if (base.options.hashPrefix) { nav_link.attr("href", "#" + base.options.hashPrefix + "_" + (i + 1)); }	// как у jQuery.bbq плагина
				if (base.options.navDrawPageNumber) { nav_link.text(i + 1); }	// было html вместо text
				$(base.options.navigation).append(nav_link);
			}
			$(base.options.navigation).children('a').first().addClass('Active');
			$(base.options.navigation).delegate('a', 'click', function () {
				if (base.animating || $(this).hasClass('Active')) {
					return false;
				}
				var target_page = $(this).data('items')[0];
				$(this).addClass('Active').siblings().removeClass('Active');
				if (base.options.hashPrefix) {
					base.updateHashUrl(target_page);
				}
				base.gotoPage(target_page);
				return false;
			});
		};

		/* Инициализация кнопок вперед/назад */
		base.buildNextPrevButtons = function() {
			if (base.options.hashPrefix) {
				base.updateNextPrevLinks();
			}
			base.$el.parent().find(base.options.buttons_selector).click(function () {
				if(!base.animating) {
					if ($(this).is(base.options.prev)) {
						base.goPrevPage();
					} else {
						base.goNextPage();
					}
				}
				return false;
			});
		};
		base.animateRotator = function(container_shift, start_index, step, is_prev) {
			var $navlinks = $(base.options.navigation).children('a'),
				duration = base.options.speed,
				rotator_container = base.$container;

				rotator_container.animate({ left: container_shift }, {
					duration: duration,
					easing: base.options.easing,
					complete: function () {
						if (!is_prev && !base.operamode) {
							rotator_container.children(base.options.items).filter(":visible").slice(0, step).hide();
						}
						var current_page = base.currentPage;
						if (base.options.navigation) {
							$navlinks.removeClass('Active').each(function () {
								if (jQuery.inArray(current_page, $(this).data('items')) > -1) {
									$(this).addClass('Active');
								}
							});
						}
						if (base.options.hashPrefix) {
							base.updateNextPrevLinks();
						}
						if (!base.operamode) {
							rotator_container.children(base.options.items).filter("[is_clone=true]").detach();
							rotator_container.css(base.after_animate_css);
						} else {
							if (!is_prev) {
								rotator_container.children(base.options.items).slice(0,2).detach();
							} else {
								rotator_container.children(base.options.items).slice(-2).detach();
							}
							rotator_container.css(base.opera_after_animate_css);
						}
						base.animating = false;
						if (base.options.onMoveComplete && typeof(base.options.onMoveComplete) == 'function') {
							base.options.onMoveComplete(current_page);
						}
					}
				});
		};
		/*base.buildAutoPlay = function() { //TODO
		};*/

		/* startStop(false) - поставить на паузу, startStop(true) - запустить слайдшоу */
		base.startStop = function() {
			if (base.playing !== true) { base.playing = false; }

			if (base.playing){
				base.clearTimer();
				base.timer = setTimeout(function() {
					if (!base.animating) { base.goNextPage(); }
				}, base.options.delay + base.options.speed);
			} else {
				base.clearTimer();
			}
		};

		base.clearTimer = function() {
			if (base.timer) { clearTimeout(base.timer); }			// Обнуляем таймер, если он был установлен
		};

		/* Обновляет хэш в адресной строке: <хэш_префикс_ротатора>=<target_page> */
		base.updateHashUrl = function(target_page) {
			var state = {};
			state[base.options.hashPrefix] = target_page;
			$.bbq.pushState(state);
		};

		/* Обновляет хэши у кнопок вперед/назад */
		base.updateNextPrevLinks = function() {
			var prev_index = getPrevPageIndex(base.currentPage, base.items_count),
				next_index = getNextPageIndex(base.currentPage, base.items_count);
			$(base.options.prev).attr("href", "#" + base.options.hashPrefix + "_" + prev_index);
			$(base.options.next).attr("href", "#" + base.options.hashPrefix + "_" + next_index);
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
						.load(function(response) {
							var img = $(response.currentTarget).attr('src');
							$slide.attr('src', slide_src);
						});
				}
				//$(".ContentRotatorLoader").hide();
			} else {
				return; // нет такого слайда
			}
		};

		base.changeToSlide = function(index) {
			var src_to_load = base.$items.eq(index-1).attr('loadsrc'),
				$loader = $(".ContentRotatorLoader");
			$loader.show();
				//$("<img />").attr('src', src_to_load)
				//	.load(function(response) {  			// ie8 не понимайт (плагин ImageLoaded есть для таких случаев)
				//		var img = $(response.currentTarget).attr('src');
			base.$container.children(base.options.items).first().attr('src', src_to_load);
			$loader.hide();
				//});
			if (base.options.hashPrefix) {
				base.updateNextPrevLinks();
			}
			base.animating = false;
			if (base.options.onMoveComplete && typeof(base.options.onMoveComplete) == 'function') {
				base.options.onMoveComplete(base.currentPage);
			}
		};

		/*
			Переход на страницу с указанным индексом и
			prev/next - перейти на пред/след страницу
		*/
		base.gotoPage = function(end_index) {
			if (base.animating) { return; }
			base.animating = true;
			base.clearTimer();												/* выключаем таймер слайдшоу на время переключения слайдов */
			var rotator_container = base.$container,
				current_rotator = rotator_container.find(base.options.items).filter(":visible").first(),
				start_index = current_rotator.data('index');
			if (end_index == 'prev' || end_index == 'next') {
				var step = base.options.changeCount,
					is_prev = (end_index == 'prev');
				base.currentPage = parseInt((is_prev) ? getPrevPageIndex(base.currentPage, base.items_count) : getNextPageIndex(base.currentPage, base.items_count), 10);
			} else {
				base.currentPage = parseInt(end_index, 10);
				var step = Math.abs(start_index - end_index),
					step = (step > base.items_count / 2) ? base.items_count - step : step,
					value_right = (start_index + step) % base.items_count,
					value_right = (value_right == 0) ? base.items_count : value_right,
					is_prev = (value_right != end_index);
				if (step == base.items_count / 2) {
					is_prev = false;
				}
				if (start_index == end_index) {
					base.animating = false;
					return this;
				}
			}
			var move_by = 100 * step / base.options.visibleCount;
			if (base.operamode && move_by > 200) {
				move_by = 200;
			}
			var container_shift = ((is_prev) ? '+' : '-') + '=' + move_by + '%';

			if (base.operamode) {
				base.changeToSlide(base.currentPage );
				base.startStop();
				return;

				if (is_prev) {
					var next_rotators = current_rotator.prevAll(base.options.items).slice(0, step);		// Запрос на нужное количество предыдущих слайдов
					if (next_rotators.length < step) {								// Предыдущих слайдов меньше чем требуется, значит надо перенести из конца
						var need_rotators = step - next_rotators.length;			// Количество слайдов для переноса из конца в начало

						$(base.$items.slice(base.currentPage-2, base.currentPage).get().reverse()).each(function () {
							next_rotators.add($(this).attr('is_clone', 'true').clone(true).prependTo(rotator_container).removeAttr('is_clone'));
						});
					}
					// Из-за того, что вперед были добавлены слайды, теперь надо вернуть начальную позицию ротатора обратным смещением
					rotator_container.css({ 'margin-left': -200 + '%' });

				} else {			// Движение слайдов вправо
					next_rotators = current_rotator.nextAll(base.options.items).slice(step - 1, step + base.options.visibleCount - 1);
					if (next_rotators.length < Math.max(base.options.visibleCount, step)) {
						var need_rotators = Math.max(base.options.visibleCount, step) - next_rotators.length;

						base.$items.slice(base.currentPage-1, base.currentPage+1).each(function () {
							if ($(this).is(":visible")) {
								next_rotators.add($(this).attr('is_clone', 'true').clone(true).appendTo(rotator_container).removeAttr('is_clone'));
							} else {
								next_rotators.add($(this).detach().appendTo(rotator_container).show());
							}
						});
					}
				}
			} else {
				if (is_prev) {

					var next_rotators = current_rotator.prevAll(base.options.items).slice(0, step);		// Запрос на нужное количество предыдущих слайдов
					if (next_rotators.length < step) {								// Предыдущих слайдов меньше чем требуется, значит надо перенести из конца
						var need_rotators = step - next_rotators.length;			// Количество слайдов для переноса из конца в начало
						$(rotator_container.children(base.options.items).slice(-need_rotators).get().reverse()).each(function () {
							next_rotators.add($(this).attr('is_clone', 'true').clone(true).prependTo(rotator_container).removeAttr('is_clone'));
						});
					}
					// Из-за того, что вперед были добавлены слайды, теперь надо вернуть начальную позицию ротатора обратным смещением
					rotator_container.css({ 'margin-left': -base.items_width * step * base.block_count + '%' });

					var prev_rotators = current_rotator.prevAll(base.options.items).slice(step - 1, step + base.options.visibleCount - 1);
					if (base.options.lazyLoad) {
						base.loadSlideAndSiblings(prev_rotators);
					}
				} else {
					// Движение слайдов вправо. Следующие слайды.
					current_rotator.nextAll(base.options.items).filter(":hidden").show(); //Показать все следующие
					next_rotators = current_rotator.nextAll(base.options.items).slice(step - 1, step + base.options.visibleCount - 1); // Запрос на нужное количество следующих слайдов

					if (next_rotators.length < Math.max(base.options.visibleCount, step)) {
						//Следующих слайдов меньше чем требуется, значит надо перенести из начала
						var need_rotators = Math.max(base.options.visibleCount, step) - next_rotators.length;
						rotator_container.children(base.options.items).slice(0, need_rotators).each(function () {
							if ($(this).is(":visible")) {
								next_rotators.add($(this).attr('is_clone', 'true').clone(true).appendTo(rotator_container).removeAttr('is_clone'));
							} else {
								next_rotators.add($(this).detach().appendTo(rotator_container).show());
							}
						});
					}
					if (base.options.lazyLoad) {
						base.loadSlideAndSiblings(next_rotators);
					}
				}
			}
			if (next_rotators.length > 0) {
				next_rotators.show();
			} else {  }

			base.animateRotator(container_shift, start_index, step, is_prev);
			base.startStop();
		};

		base.goNextPage = function() {
			if (base.options.hashPrefix) {
				base.updateHashUrl(getNextPageIndex(base.currentPage, base.items_count));
			}
			base.gotoPage('next');
		};

		base.goPrevPage = function() {
			if (base.options.hashPrefix) {
				base.updateHashUrl(getPrevPageIndex(base.currentPage, base.items_count));
			}
			base.gotoPage('prev');
		};
		/* В разработке */
		base.centerOnCurrentSlide = function() {
			var distToCenter = 3;//Math.ceil(base.options.visibleCount/2) - 1;
			var threshold = 1;									// по одному слайду слева и справа от центрального слайда можно нажимать без переключения ротатора
			var currentPage = base.currentPage;
			var centerSlide = currentPage + distToCenter;
			centerSlide = ( centerSlide > (base.items_count-1) || centerSlide < 1) ? Math.abs(base.items_count - Math.abs(centerSlide)) : centerSlide;

			if ( currentPage < (centerSlide - threshold) || currentPage > (centerSlide + threshold)) {
				var page_index = (currentPage > distToCenter) ?	(currentPage - distToCenter) : (base.items_count - Math.abs(currentPage - distToCenter));
				base.gotoPage('' + page_index);
			}
		};
		// Trigger the initialization
		base.init();
	};

	$.rotator2.defaults = {
		items: '.RotatorItem',			// Селектор слайдов
		prev: null,						// Селектор кнопки "Назад"
		next: null,						// Селектор кнопки "Вперед"

		visibleCount: 1,				// Количество видимых элементов
		changeCount: 1,					// Количество меняющихся элементов
		speed: 1000,					// Скорость прокрутки одного слайда
		easing: "swing",				// Эффекты переходов кроме "linear" или "swing" (т.е. нестандартные) требуют для работы easing-плагин

		navigation: null,				// Селектор для навигационного бара
		navDrawPageNumber: false,		// Рисовать ли на кнопках нав. бара номера страниц
		navPageTemplate: '<a href="#$n"><span>$i</span></a>', // Шаблон для кнопки в навигаторе
		keyboardNavigation: false,		// Переключение слайдов по стрелкам клавиатуры. Больше одного на страницу врядли стоит делать.

		onMoveComplete: false, 			// Функция, вызываемая после завершения анимации шага

		autoPlay: false,				// Режим слайдшоу
		delay: 6000, 					// Задержка между переключениями слайдов в режиме слайдшоу (без учета speed)
		pauseOnHover: false,			// Ставить ротатор на паузу, когда мышь над ним. На айпаде нет ховера!

		useSwipeTouch: false,			// Прокрутка слайдов по тачпадовским жестам.
		hashPrefix: false,				// Префикс на который ротатор будет отзываться, если не указан - на хэши ротатор не реагирует.
		lazyLoad: false,				// Загружать только слайд на который переходим, работает только для 1 картинки на слайд
		fixopera: false,				// Deprecated
		newMode: true
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
			return this.each(function(i) {
				(new $.rotator2(this, options));
			});
		// If options is a number, process as an external link to page #: $(element).anythingSlider(#)
		} else if (/\d/.test(options) && !isNaN(options)) {
			return this.each(function(i) {
				var founded_rotator = $.data(this,'rotator_link');
				if (founded_rotator) {
					var page = (typeof(options) == "number") ? options : parseInt($.trim(options),10); // accepts "  2  "
					// ignore out of bound pages
					if ( page < 1 || page > founded_rotator.items_count ) { return; }
					founded_rotator.gotoPage(page);
				}
			});
		}
	};
})(jQuery);