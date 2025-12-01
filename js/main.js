/**
* Template Name: Folio - v2.1.0
* Template URL: https://bootstrapmade.com/folio-bootstrap-portfolio-template/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
(function($) {
  "use strict";

  // Smooth scroll for the navigation menu and links with .scrollto classes
  var scrolltoOffset = $('#main-nav').outerHeight() - 1;
  $(document).on('click', '.nav-menu a, .mobile-nav a, .scrollto', function(e) {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      if (target.length) {
        e.preventDefault();

        var scrollto = target.offset().top - scrolltoOffset;

        $('html, body').animate({
          scrollTop: scrollto
        }, 1500, 'easeInOutExpo');

        if (window.matchMedia("(max-width:991px)").matches) {
          $('.nav-menu').hide();
        }
        return false;
      }
    }
  });

  // Activate smooth scroll on page load with hash links in the url
  $(document).ready(function() {
    if (window.location.hash) {
      var initial_nav = window.location.hash;
      if ($(initial_nav).length) {
        var scrollto = $(initial_nav).offset().top - scrolltoOffset;
        $('html, body').animate({
          scrollTop: scrollto
        }, 1500, 'easeInOutExpo');
      }
    }
  });

  // ========================================================================= //
  //  //NAVBAR SHOW - HIDE
  // ========================================================================= //

  $(window).scroll(function() {
    var scroll = $(window).scrollTop();
    if (!$('.subpage-nav').length) {
      if (scroll > 200) {
        $("#main-nav").slideDown(700);
      } else {
        $("#main-nav").slideUp(700);
      }
    }
  });

  // ========================================================================= //
  //  // RESPONSIVE MENU
  // ========================================================================= //

  $('.responsive').on('click', function(e) {
    $('.nav-menu').slideToggle();
  });

  // ========================================================================= //
  //  Typed Js
  // ========================================================================= //

  var typed = $(".typed");

  $(function() {
    var strings = $('.typed-items').text();
    strings = $('.typed-items').data('typed-person') + ',' + strings;
    strings = strings.split(',');

    typed.typed({
      strings: strings,
      typeSpeed: 100,
      loop: true,
    });
  });

  // ========================================================================= //
  //  Owl Carousel Services
  // ========================================================================= //

  $('.services-carousel').owlCarousel({
    autoplay: true,
    loop: true,
    margin: 20,
    dots: true,
    nav: false,
    responsiveClass: true,
    responsive: {
      0: {
        items: 1
      },
      768: {
        items: 2
      },
      900: {
        items: 4
      }
    }
  });

  // ========================================================================= //
  //  Porfolio isotope and filter
  // ========================================================================= //
  $(window).on('load', function() {
    var portfolioIsotope = $('.portfolio-container').isotope({
      itemSelector: '.portfolio-item',
      layoutMode: 'fitRows'
    });

    $('#portfolio-flters li').on('click', function() {
      $("#portfolio-flters li").removeClass('filter-active');
      $(this).addClass('filter-active');

      portfolioIsotope.isotope({
        filter: $(this).data('filter')
      });
    });
  });

  // Initiate venobox (lightbox feature used in portofilo)
  $(document).ready(function() {
    $('.venobox').venobox();
  });

  // Portfolio details carousel
  $(".portfolio-details-carousel").owlCarousel({
    autoplay: true,
    dots: true,
    loop: true,
    items: 1
  });

  // Original portfolio/item-list functionality
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
    
    // Portfolio isotope filter
    var $container = $('#container');
    if ($container.length) {
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
    }
    
    $('.fancybox').fancybox({
      helpers: {
        overlay: {
          locked: false
        }
      }
    });
    
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

})(jQuery);
