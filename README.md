
##Basic Chat Application  
* Built with jQuery Mobile/Node.js/MongoDB


##Design Architecture

See what the app looks like [mychat2]

###Front End
1. UI - jQuery Mobile 1.3.2

2. Namespacing  
Single global: mdhChat

3. MVC architecture based on book [Single Page Web Applications]
* Models (model.js)  
Implements people object to manage user sign-in/sign-up/active.  
Implements chat object for handling user chat messages  
Data binding - emits events to Controller using [jquery.event.gevent] jquery plugin  

* Templates  
Statically defined. No library used.  

* Views  
AppView     - Implemented by controller (shell.js)  
SignInView  - Implemented by controller (shell.js)  
SignUpView  - Implemented by controller (shell.js)  
ChatView    - Implemented by chat-main.js, listens for model events

* Controller (shell.js)  
Handles user sign-up/sign-in, listens for  model events  
handles routing/hashchange events, view management  

* Backend sync (data.js)  
Socket.io is used for chat and user signup/sign-in messages to server


5. Admin interface  [mychat2-admin]
* Uses REST API/AJAX for administration tasks  
Login/Logout, show users (active or logged out), delete users  (admin.js)

Admin user login credentials are: test/test


###Back End

1. Node 0.10.x/Express 3.2.x
2. MongoDB 2.6.x/mongodb Native driver 1.3.x

###Cloud Hosting

[Heroku]

[mongolab]

###Todo
Use PhoneGap to convert to native app  
Use Mongoose instead of custom driver

 [jquery.event.gevent]:https://github.com/mmikowski/jquery.event.gevent

[Single Page Web Applications]:http://www.amazon.com/Single-Page-Applications-end---end/dp/1617290750/ref=sr_1_1?s=books&ie=UTF8&qid=1405382977&sr=1-1&keywords=single+page+web+applications

[mychat2]:http://mychat2.herokuapp.com/

[mychat2-admin]:http://mychat2.herokuapp.com/login

[Heroku]:https://www.heroku.com/

[mongolab]:https://mongolab.com/welcome/
