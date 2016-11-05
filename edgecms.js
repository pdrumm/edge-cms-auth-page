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

    function generateToken () {
        var domainName = document.getElementById("domainName").value;
        domainName = extractDomain(domainName);
        var domainCodeRef = firebase.database().ref().child("domains").child(domainName).child("code");
        var newCodeRef = domainCodeRef.push(true);
        var domainKey = newCodeRef.key;
        domainCodeRef.set(domainKey);

        showMetaTag(domainKey);
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
        domainName = domainName.replace(/\./g, "~");
        // Get Key from Firebase
        firebase.database().ref().child("domains").child(domainName).child("code").once("value", function (snapshot) {
            var firebaseKey = snapshot.val();
            console.log(firebaseKey);
        });
        // Get Key from domain
        $.ajax({
            type:"POST",
            contentType: "application/json; charset=utf-8",
            url:"https://nsk4wcwu09.execute-api.us-east-1.amazonaws.com/beta",
            data:{url: domainName},
            success: function(result) {
                var domainKey = result.code;
                console.log(domainKey);
            }
        });
        // Compare Key from Firebase vs. from domain
    }

    function addListeners () {
        var generateKeyBtn = document.getElementById("generateKeyBtn");
        generateKeyBtn.addEventListener("click", generateToken);
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