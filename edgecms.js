var edgeCMS = (function() {
    var edgeCMS = {};

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

    function generateKey () {
        // Extract domain name
        var domainName = document.getElementById("domainName").value;
        domainName = extractDomain(domainName);
        // Dont generate token for active sites
        var domainRef = firebase.database().ref().child("domains").child(domainName);
        domainRef.child("pending").once("value", function (snapshot) {
            if (snapshot.exists() && snapshot.val()===false) {
                // site is already registered with Edge CMS
                alert("This site has already been registered. Please contact the site owner.");

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
                $('#modal1').modal("open");
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
        var domainName = document.getElementById("domainName").value;
        domainName = extractDomain(domainName);

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
                data:{url: domainName},
                success: function(result) {
                    var domainKey = result.code;
                    resolve(domainKey);
                }
            });
        });

        // Compare Key from Firebase vs. from domain
        Promise.all([p1, p2]).then(values => {
            if (values[0] === values[1]) {
                alert("Success");
            } else {
                alert("Nope");
            }
        });
    }

    function addListeners () {
        var generateKeyBtn = document.getElementById("generateKeyBtn");
        generateKeyBtn.addEventListener("click", generateKey);
        var verifySiteBtn = document.getElementById("doneButton");
        verifySiteBtn.addEventListener("click", verifySite);
    }

    edgeCMS.begin = function () {
        new Clipboard('.btn');
        prepareFirebase();
        addListeners();
    };

    return edgeCMS;
}());