var rotator_selector = "#RotatorWithHashesAndMultipleBlocks";
var navlinks_selector = "#RotatorPaging a";


function getSlidesArray() {
	var testarray = [];
	$(rotator_selector).find(".RotatorItem").each(function() { testarray.push($(this).attr("index")); })
	return testarray;
}
function getSliderInnerPage() {
	return $(rotator_selector).data('rotator_link').currentPage;
}
function getPageIndexFromNavigation() {
	$(navlinks_selector).filter(function() { return $(this).hasClass("Active"); }).index(navlinks_selector)+1;
}

$(document).ready(function() {
	$("#RotatorWithHashesAndMultipleBlocks").rotator2({
		itemsSelector: '.RotatorItem',
		prev: '#RotatorPrevLink',
		next: '#RotatorNextLink',
		blocksPerScreen: 3,
		blocksChangePerPage: 1,
		hashPrefix: "slide",
		easing: "easeOutQuad",
		speed: 500,
		keyboardNavigation: false,
		navSelector: '#RotatorPaging',
		navPageTemplate: '<a href="#"><span>$i</span></a>',
		onMoveComplete: function(index){  }
	});



module("Проверка готовности", {
	setup: function() {
		ok(true);
	}
});
module("Проверка инициализации слайдера");
	var testarray = getSlidesArray();
	test("Проверка слайдов после инициализации", function() {
		equals(testarray.length,  									  9,   "Блоков в слайдере должно быть 9");
		notEqual(testarray.length,									  0,   "В слайдере должно быть больше нуля блоков");
		equals( $(rotator_selector).data('rotator_link').currentPage, 1);
		equals(
			$(navlinks_selector).filter(
				function() { 
					return $(this).hasClass("Active"); 
				}).index(navlinks_selector)+1, 						  1,   "В навигационном меню должна быть выделена первая страница");
	})

module("Базовая проверка на корректное переключение слайдов");  
	asyncTest("Переключаемся на первую страницу", function() {
		$(rotator_selector).rotator2(2);
		setTimeout(function(){
			var testarray = getSlidesArray();
			notDeepEqual(testarray.slice(3,4), 2,     "После переключения на 2ю страницу 4й блок в ротаторе должен быть с номером 2");
			equals(getSliderInnerPage(),       2,     "После переключения на второй слайд он должне отдавать наружу currentPage равный 2ке");
			equals(testarray.length,           9,     "Блоков в слайдере должно быть 9");
			notEqual(testarray.length,         5,     "Блоков в слайдере должно быть не 5");
			equals(
				$(navlinks_selector).filter(
					function() { 
						return $(this).hasClass("Active"); 
					}).index(navlinks_selector)+1, 2,	"В навигационном меню должно быть выделена 2я страница");
			start();
		}, 3000);
	});
	asyncTest("Переключаемся на следующую страницу", function() {
		$(rotator_selector).data('rotator_link').goNextPage();
		setTimeout(function(){
			var testarray = getSlidesArray();
			notDeepEqual(testarray.slice(3,4),   3,     "После переключения на 3ю страницу 4й блок в ротаторе должен быть с номером 2+1=3");
			equals(getSliderInnerPage(),         3,     "После переключения на второй слайд он должне отдавать наружу currentPage равный трем");
			equals(testarray.length,             9,     "Блоков в слайдере должно быть 9");
			notEqual(testarray.length,           5,     "Блоков в слайдере должно быть не 5");
			equals(
				$(navlinks_selector).filter(
					function() { 
						return $(this).hasClass("Active"); 
					}).index(navlinks_selector)+1, 3,	"В навигационном меню должно быть выделена 3я страница");
			start();
		}, 3000);
	});
	asyncTest("Переключаемся на 6ю страницу", function() {
		$(rotator_selector).rotator2(6);
		setTimeout(function(){
			var testarray = getSlidesArray();
			notDeepEqual(testarray.slice(3,4),   6,     "После переключения на 6ю страницу 4й блок в ротаторе должен быть с номером 6");
			equals(getSliderInnerPage(),         6,     "После переключения на второй слайд он должне отдавать наружу currentPage равный 6");
			equals(testarray.length,             9,     "Блоков в слайдере должно быть 9");
			notEqual(testarray.length,           5,     "Блоков в слайдере должно быть не 8");
			equals(
				$(navlinks_selector).filter(
					function() { 
						return $(this).hasClass("Active"); 
					}).index(navlinks_selector)+1, 6,	"В навигационном меню должно быть выделена 3я страница");
			start();
		}, 3000);
	});
	asyncTest("Переключаемся на предыдущую страницу (5 с шестой)", function() {
		$(rotator_selector).data('rotator_link').goPrevPage();
		setTimeout(function(){
			var testarray = getSlidesArray();
			notDeepEqual(testarray.slice(3,4),   5,     "После переключения на 5ю страницу 4й блок в ротаторе должен быть с номером 5");
			equals(getSliderInnerPage(),         5,     "После переключения на второй слайд он должне отдавать наружу currentPage равный 5");
			equals(testarray.length,             9,     "Блоков в слайдере должно быть 9");
			notEqual(testarray.length,           5,     "Блоков в слайдере должно быть не 8");
			equals(
				$(navlinks_selector).filter(
					function() { 
						return $(this).hasClass("Active"); 
					}).index(navlinks_selector)+1, 5,	"В навигационном меню должно быть выделена 5я страница");
			start();
		}, 3000);
	});

});