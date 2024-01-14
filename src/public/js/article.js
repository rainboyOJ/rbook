//copy to clipboard
document.querySelectorAll('.zeroclipboard-container').forEach( function(clipContainer){
    clipContainer.addEventListener('click', function(event) {
        if( clipContainer.classList.contains('copied')) return;

        let text = clipContainer.parentNode.textContent
        clipContainer.classList.add('copied');
        navigator.clipboard.writeText(text).then( ()=>{
            setTimeout( ()=> clipContainer.classList.remove('copied'),1500)
        },
            ()=> { //failed
                setTimeout( ()=> clipContainer.classList.remove('copied'),1500)
                alert("copy failed!");
            }
        )
    })
})

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
