/**
 * Auric Testimonials Video Player
 * 
 * This script adds functionality to the testimonials video section
 * It ensures only one video plays at a time
 */

document.addEventListener('DOMContentLoaded', function() {
    initTestimonialVideos();
});

function initTestimonialVideos() {
    const scrollContainer = document.querySelector('.testimonials-scroll');
    
    // Exit if the testimonials container doesn't exist on this page
    if (!scrollContainer) return;
    
    // Make testimonial videos play one at a time
    const videos = document.querySelectorAll('.testimonial-video');
    videos.forEach(video => {
        video.addEventListener('play', function() {
            // Pause all other videos
            videos.forEach(v => {
                if (v !== video && !v.paused) {
                    v.pause();
                }
            });
        });
    });
}