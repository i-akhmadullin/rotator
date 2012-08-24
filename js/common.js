$(document).ready(function() {
	$("#b-rotator").rotator2({
		itemsSelector:       '.b-rotator__item',
		prev:                '#b-rotator__prev',
		next:                '#b-rotator__next',
		blocksPerScreen:     1,
		blocksChangePerPage: 1,
		autoPlay:            true,
		keyboardNavigation:  true,
		containerOverflow:   'visible'
	});
	$("#b-rotator-hashes").rotator2({
		itemsSelector:       '.b-rotator__item',
		prev:                '#b-rotator__prev',
		next:                '#b-rotator__next',
		blocksPerScreen:     1,
		blocksChangePerPage: 1,
		hashPrefix:          "slide",
		//'autoPlay: true,
		easing:              "easeOutQuad",
		keyboardNavigation:  false,
		navSelector:         '#b-rotator__paging',
		navPageTemplate:     '<a href="#"><span>$i</span></a>'
	});
	$("#RotatorWithHashesAndMultipleBlocks").rotator2({
		itemsSelector:       '.b-rotator__item',
		prev:                '#b-rotator__prev',
		next:                '#b-rotator__next',
		blocksPerScreen:     4,
		blocksChangePerPage: 2,
		hashPrefix:          "slide",
		//'autoPlay':        true,
		keyboardNavigation:  false,
		navSelector:         '#b-rotator__paging',
		navPageTemplate:     '<a href="#"><span>$i</span></a>',
		autoWidthCheck:      'opera'/*,
		onMoveComplete:      function(index){
			testarray=[];
			$("#RotatorWithHashesAndMultipleBlocks").find(".b-rotator__item").each(function() { testarray.push($(this).attr("index")); })
			$("#result").html("Result array: "+testarray.slice(0,3).toString()+",<span style=\"color:red;\">"+testarray[3]+"</span>," + testarray.slice(4).toString() );
		}*/
	});
});