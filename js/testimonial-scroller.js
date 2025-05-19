/**
 * Auric Buy and Watch Video Player
 * 
 * This script adds functionality to the Buy and Watch video section
 * with custom play button controls and ensuring only one video plays at a time
 */

document.addEventListener('DOMContentLoaded', function() {
    initBuyAndWatchVideos();
});

function initBuyAndWatchVideos() {
    const scrollContainer = document.querySelector('.testimonials-scroll');
    
    // Exit if the container doesn't exist on this page
    if (!scrollContainer) return;
    
    const videoContainers = document.querySelectorAll('.video-container');
    const videos = document.querySelectorAll('.testimonial-video');
    
    // Set up play button functionality
    videoContainers.forEach((container, index) => {
        const video = container.querySelector('.testimonial-video');
        const playButton = container.querySelector('.play-button');
        const playButtonOverlay = container.querySelector('.play-button-overlay');
        
        // Click on play button or video container plays the video
        container.addEventListener('click', function(e) {
            // Don't trigger if clicking on the link icon
            if (e.target.closest('.video-link-icon')) return;
            
            if (video.paused) {
                // First pause all other videos
                videos.forEach(v => {
                    if (v !== video && !v.paused) {
                        v.pause();
                        // Show play button on other videos
                        v.closest('.video-container').querySelector('.play-button-overlay').style.display = 'flex';
                    }
                });
                
                // Then play this video
                video.play();
                // Hide play button when playing
                playButtonOverlay.style.display = 'none';
            } else {
                // Pause the video
                video.pause();
                // Show play button when paused
                playButtonOverlay.style.display = 'flex';
            }
        });
        
        // When video ends, show play button again
        video.addEventListener('ended', function() {
            playButtonOverlay.style.display = 'flex';
        });
        
        // Make testimonial videos play one at a time
        video.addEventListener('play', function() {
            // Hide play button when playing
            playButtonOverlay.style.display = 'none';
            
            // Pause all other videos
            videos.forEach(v => {
                if (v !== video && !v.paused) {
                    v.pause();
                    // Show play button on other videos
                    v.closest('.video-container').querySelector('.play-button-overlay').style.display = 'flex';
                }
            });
        });
        
        // Show play button when video is paused
        video.addEventListener('pause', function() {
            playButtonOverlay.style.display = 'flex';
        });
    });
}