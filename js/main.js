$(document).ready(function() {
	$(".item-list li").mouseenter(function(){
        $(this).find($('.item-list .hover')).stop(true, true).fadeIn(600);
        return false;
     });
      $('.item-list li').mouseleave(function(){
        $(this).find($('.item-list .hover')).stop(true, true).fadeOut(400);
        return false;
     });
      jQuery(document).on('click', ".menu_trigger", function (e) {
        e.preventDefault()
        window.setTimeout(function() {
            if(jQuery('#nav').hasClass('clicked')){
                jQuery('#nav').stop(true,true).animate({height:'hide'},100);
                jQuery('#nav').removeClass('clicked');
            }else{
                jQuery('#nav').stop(true,true).animate({height:'show'},400);
                jQuery('#nav').addClass('clicked');
            }
        }, 400);
        return false;
    });
    jQuery("#nav").on('click', '.drops', function () {
        if (jQuery(this).hasClass("active")) {
            jQuery(this).removeClass("active").parent().next().slideUp();
        } else {
            jQuery(this).addClass("active").parent().next().slideDown();
        }
        return false;
    });
// begin add
	var $container = $('#container');
	// init
	$container.isotope({
		// options
		itemSelector: '.item',
		layoutMode: 'cellsByRow',
		cellsByRow: {
			columnWidth: 295,
			rowHeight: 295
		}
		});

	$('#filters').on( 'click', 'li', function() {
		var filterValue = $(this).attr('data-filter');
		$container.isotope({ filter: filterValue });
		$( "#filters li" ).removeClass("active");
		$(this).addClass("active");
	});
	$('.fancybox').fancybox({
	  helpers: {
	    overlay: {
	      locked: false
	    }
	  }
	});
// end add
});
// Debounce resize handler to prevent jitter
var resizeTimer;
$(window).resize(function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        if($(document).width() > 1024){
          $( "#nav" ).addClass("active");
          $( "#nav ul" ).attr('style','');
          $( "#nav" ).attr('style','');
          $( "#nav" ).removeClass("clicked");
          $( "#nav .active" ).removeClass('active');
        }
        else {
            $( "#nav" ).removeClass("active");
        }
    }, 150);
});

$(document).ready(function(){
  // Only run on pages that have filter navigation (portfolio page)
  const filtersContainer = document.querySelector('#filters');
  if (filtersContainer) {
    const activeLi = document.querySelector('#filters li.active, .filters li.active');
    if (activeLi && typeof activeLi.click === 'function') {
      try {
        activeLi.click();
      } catch (e) {
        // Silently fail if click doesn't work
        console.debug('Could not trigger active filter click:', e);
      }
    }
  }
});
