/**
 * Auric Testimonials Scroller
 * 
 * This script adds scrolling functionality to the testimonials section
 * It allows users to scroll through the testimonial videos using buttons
 */

document.addEventListener('DOMContentLoaded', function() {
    initTestimonialScroller();
});

function initTestimonialScroller() {
    const scrollContainer = document.querySelector('.testimonials-scroll');
    const scrollLeftBtn = document.getElementById('scrollLeft');
    const scrollRightBtn = document.getElementById('scrollRight');
    
    // Exit if the testimonials container doesn't exist on this page
    if (!scrollContainer) return;
    
    // Scroll left button click handler
    scrollLeftBtn.addEventListener('click', function() {
        // Scroll by the width of one testimonial item plus gap
        scrollContainer.scrollBy({
            left: -350, // Width of testimonial plus gap
            behavior: 'smooth'
        });
    });
    
    // Scroll right button click handler
    scrollRightBtn.addEventListener('click', function() {
        // Scroll by the width of one testimonial item plus gap
        scrollContainer.scrollBy({
            left: 350, // Width of testimonial plus gap
            behavior: 'smooth'
        });
    });
    
    // Make testimonial videos play on click
    const videos = document.querySelectorAll('.testimonial-video');
    videos.forEach(video => {
        video.addEventListener('click', function() {
            if (video.paused) {
                // Pause all other videos
                videos.forEach(v => {
                    if (v !== video && !v.paused) {
                        v.pause();
                    }
                });
                video.play();
            } else {
                video.pause();
            }
        });
    });
}