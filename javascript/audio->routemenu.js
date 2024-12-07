document.getElementById('controls').addEventListener('click', (event) => {
    event.stopPropagation();
    document.getElementById('controls-window').style.visibility = 'visible';
});
document.getElementById('close-window').addEventListener('click', () => {
    document.getElementById('controls-window').style.visibility = 'hidden';
} )
