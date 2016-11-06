(function() {
    var edgeCMS = {};

    var domainUrl;
    var domainName;

    function prepareFirebase() {
        var config = {
            apiKey: "AIzaSyBuWvVLmh4NGzfzsGBKIqmRsR9BtVJF1zE",
            authDomain: "edge-cms.firebaseapp.com",
            databaseURL: "https://edge-cms.firebaseio.com",
            storageBucket: "edge-cms.appspot.com",
            messagingSenderId: "1082973155115"
        };
        firebase.initializeApp(config);
    }

    var watchScrolls = true;
    $("#scrollDownButton").on("click", function() {
      console.log("click");
      watchScrolls = false;
      $('html, body').animate({
        scrollTop: $("#domainListWrapper").offset().top - 30
      }, 1000, "linear", function() {
        watchScrolls = true;
      });
    });

    var lastScrollPos = 0;
    $( window ).scroll(function() {
      var newScrollPos = $(window).scrollTop();
      if(newScrollPos > lastScrollPos && newScrollPos < 100 && watchScrolls) {
        watchScrolls = false;
        $('html, body').animate({
          scrollTop: $("#domainListWrapper").offset().top - 30
        }, 800, "linear", function() {
          watchScrolls = true;
        });
      }
      lastScrollPos = newScrollPos;
    });

    function generateKey () {
        // Extract domain name
        domainUrl = document.getElementById("domainName").value;
        domainName = extractDomain(domainUrl);

        var domainRef = firebase.database().ref().child("domains").child(domainName);
        domainRef.child("pending").once("value", function (snapshot) {
            if (snapshot.exists() && snapshot.val()===false) {
                // site is already registered with Edge CMS
                showMessage("Authentication Error", "This site has already been registered. Please contact the site owner.");

            } else {
                if (!snapshot.exists()) {
                    domainRef.child("pending").set(true);
                }
                // Generate unique key
                var newCodeRef = domainRef.child("code").push(true);
                var domainKey = newCodeRef.key;
                domainRef.child("code").set(domainKey);
                // Update html with token
                showMetaTag(domainKey);
                // Open modal
                $('#codeModal').modal("open");
            }
        });
    }

    function extractDomain(url) {

        url = url.replace(/\./g, "~");

        var domain;
        //find & remove protocol (http, ftp, etc.) and get domain
        if (url.indexOf("://") > -1) {
            domain = url.split('/')[2];
        }
        else {
            domain = url.split('/')[0];
        }

        //find & remove port number
        domain = domain.split(':')[0];

        return domain;
    }

    // Update the input text box with the domain's meta tag
    function showMetaTag (key) {
        metaTag = '<meta name="edge-cms-key" content="' + key + '"/>';
        document.getElementById("edgeCmsKey").size = metaTag.length;
        document.getElementById("edgeCmsKey").value = metaTag;
        document.getElementById("copyBtn").setAttribute("data-clipboard-text", metaTag);
    }

    function verifySite () {
        // Get Key from Firebase
        var p1 = new Promise((resolve, reject) => {
            firebase.database().ref().child("domains").child(domainName).child("code").once("value", function (snapshot) {
                var firebaseKey = snapshot.val();
                resolve(firebaseKey);
            });
        });

        // Get Key from domain
        var p2 = new Promise((resolve, reject) => {
            $.ajax({
                type:"POST",
                contentType: "application/json; charset=utf-8",
                url:"https://nsk4wcwu09.execute-api.us-east-1.amazonaws.com/beta",
                data:{url: domainUrl},
                success: function(result) {
                    var domainKey = result.code;
                    resolve(domainKey);
                }
            });
        });

        // Compare key from Firebase vs. key from domain
        Promise.all([p1, p2]).then(values => {
            if (values[0] === values[1]) {
                // Add user to domains tree
                var domainRef = firebase.database().ref().child("domains").child(domainName);
                domainRef.child("users").child(user.uid).set("owner");
                // Add domain to users tree
                firebase.database().ref().child("users").child(user.uid).child("domains").child(domainName).set(true);
                // Switch domain from pending to active
                domainRef.child("pending").set(false);
                // Show the user success message
                showMessage("Success!", "Your domain ownership has been verified.");

            } else {
                showMessage("Error", "We couldn't find the necessary meta tag on your site.");
            }
        });
    }

    function updateDomainList () {
        var domainList = $("#domainList")[0];
        firebase.database().ref().child("users").child(user.uid).child("domains").on("child_added", function(snapshot) {
            var domain = snapshot.key;
            var $li = $('<li></li>')[0];
            var $divHeader = $('<div class="collapsible-header blue white-text">' + domain.replace(/~/g,".") + '</div>')[0];
            var $divBody = $('<div class="collapsible-body blue-text"></div>')[0];
            firebase.database().ref().child("domains").child(domain).child("users").on("child_added", function(snapshot) {
                var uid = snapshot.key;
                var status = snapshot.val();
                firebase.database().ref().child("users").child(uid).once("value", function(snapshot) {
                    var email = snapshot.val().email;
                    var $divRow = $('<div class="valign-wrapper" style="height: 55px;"></div>')[0];
                    $divRow.append($('<div class="col s10 offset-s1 valign">'+email+' : '+status+'</div>')[0]);
                    //$divRow.append($('<a class="btn-floating btn waves-effect waves-light red valign delete-user" data="'+uid+'"><i class="material-icons" style="pointer-events: none">delete</i></a>')[0]);
                    var $a = $('<a class="btn-floating btn waves-effect waves-light red valign delete-user"><i class="material-icons" style="pointer-events: none">delete</i></a>');
                    $a.data("uid", uid);
                    $a.data("domain", domain);
                    var $i = $('<i class="material-icons" style="pointer-events: none">delete</i>')[0];
                    $a.append($i);
                    $divRow.append($a[0]);
                    $divBody.append($divRow);
                    $divBody.append($('<hr/>')[0]);
                });
            });
            $li.append($divHeader);
            $li.append($divBody);
            domainList.append($li);
            // *for the first child added* reveal the domains list
            $("#domainListWrapper").css("display", "block")
        });
    }

    $("div#domainListWrapper").on("click", function(event) {
        var e = $(event.target);
        if (e.hasClass("delete-user")) {
            var uid = e.data("uid");
            var domain = e.data("domain");
            if (uid === user.uid) {
                showMessage("Error", "You may not delete yourself as a user.");
            } else {
                $("#deleteUserModal").modal("open");

                $("#yes-delete").on("click", function () {
                    firebase.database().ref().child("domains").child(domain).child("users").child(uid).remove();
                    firebase.database().ref().child("users").child(uid).child("domains").child(domain).remove();
                    if (e.parent().next()[0] != undefined) {
                        e.parent().next()[0].remove();
                    }
                    e.parent()[0].remove();
                });
            }
        }
    });

    function addListeners () {
        var generateKeyBtn = document.getElementById("generateKeyBtn");
        generateKeyBtn.addEventListener("click", generateKey);
        var verifySiteBtn = document.getElementById("doneButton");
        verifySiteBtn.addEventListener("click", verifySite);
    }

    $(document).ready(function () {
        new Clipboard('.btn');
        prepareFirebase();
        addListeners();
    });

    /*
    Authentication
     */
    var user;

    $(document).ready(function(){
        $('#howToModal').modal({
            dismissible: true
        });
        $('#codeModal').modal({
            dismissible: true
        });
        $('#loginModal').modal({
            dismissible: false
        });
        $('#signUpModal').modal({
            dismissible: true
        });
        $('#messageModal').modal({
            dismissible: true,
            starting_top: '25%',
            ending_top: '35%'
        });
        $('#deleteUserModal').modal({
            dismissible: true,
            starting_top: '25%',
            ending_top: '35%'
        });

        firebase.auth().onAuthStateChanged(function(_user) {
            if (_user) {
                user = _user;
                updateDomainList();
                $("#loginModal").modal("close");
                $("#signUpModal").modal("close");

                // Add user to db if not already there
                var ref = firebase.database().ref().child("users");
                ref.once('value').then(function(snapshot) {
                  if (!snapshot.hasChild(user.uid)) {
                    ref.child(user.uid).set({email: user.email});
                  }
                });
            } else {
                $("#loginModal").modal("open");
            }
        });
    });

    function showMessage(title, message) {
        $("#title").text(title);
        $("#message").text(message);
        $("#messageModal").modal("open");
    }

    $("#logoutButton").on('click', function() {
        firebase.auth().signOut();
    });

    $("#howToButton").on('click', function() {
        $("#howToModal").modal('open');
    });

    $("#loginForm").on('submit', function(event) {
        event.preventDefault();
        firebase.auth().signInWithEmailAndPassword($("#email").val(), $("#password").val()).catch(function(error) {
            console.log(error);
        });
    });

    $("#signUpForm").on('submit', function(event) {
        event.preventDefault();
        if ($("#signUpPassword").val() === $("#signUpPassword2").val()) {
            firebase.auth().createUserWithEmailAndPassword($("#signUpEmail").val(), $("#signUpPassword").val()).catch(function(error) {
                console.log(error);j
            });
        } else {
            console.log("Passwords must match");
        }
    });

}());
