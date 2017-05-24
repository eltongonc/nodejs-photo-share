/******************
** sections
******************/
var section = {
    list : document.querySelectorAll('.page')
}

var app = {
    init: function(){
        routes.init();
    }
}

var routes = {
       init(){
           sections.toggle("login")
        //    location.hash = "login";
       },
       // change the route
       hashChange: window.addEventListener("hashchange", function(e){
           var newUrl = e.newURL.split("#")[1]
           sections.toggle(newUrl);
       }),
};

var sections = {
        // function that hides all sections and shows one.
        toggle: function(page){
            // hide all sections
            for (var i = 0; i < section.list.length; i++) {
                console.log(section.list[i]);
                section.list[i].classList.add('hidden')
            }

            if (sections.show[page]) {
                console.log(page);
                document.getElementById(page).classList.remove('hidden');
                console.log(page);
                sections.show[page]()
            }
        },
        show: {
            login: function(){
                let form = document.querySelector('form[action="#room-overview"]');
                form.addEventListener("submit", function(e){
                    e.preventDefault();
                    // TODO link to database
                    var username = document.querySelector('#username').value;
                    if(username){
                        console.log(username);
                        // localStorage.setItem(socket.id, username);
                        socket.emit('new user', socket.id, username)
                        location.hash = "room-overview";
                    }
                });
            },
            // Routes for home
            "room-overview": function(){
                // socket.to('new list')
                location.replace("#moodboard")
            },
            // Routes for searched content
            "moodboard": function(){

            }
        }
    };

app.init();

// render the rooms picker
