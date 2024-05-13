const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

function init_copy(params) {

    //copy to clipboard
    document.querySelectorAll('.zeroclipboard-container').forEach( function(clipContainer){
        clipContainer.addEventListener('click', function(event) {
            console.log(clipContainer.parentNode.parentNode)
            if( clipContainer.classList.contains('copied')) return;

            let text = clipContainer.parentNode.parentNode.querySelector('pre > code').textContent
            clipContainer.classList.add('copied');
            try {
                navigator.clipboard.writeText(text).then( ()=>{
                    setTimeout( ()=> clipContainer.classList.remove('copied'),1500)
                })
            }
            catch(err) {
                alert('failed to copy!',err)
            }
        })
    })
}

document.addEventListener("DOMContentLoaded", function() {
    init_copy();
});
