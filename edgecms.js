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
        var domainCodeRef = firebase.database().ref().child("domains").child(domainName).child("code");
        var newCodeRef = domainCodeRef.push(true);
        var domainKey = newCodeRef.key;
        domainCodeRef.set(domainKey);

        showMetaTag(domainKey);
    }

    function showMetaTag (key) {
        metaTag = '<meta name="edge-cms-key" content="' + key + '"/>';
        document.getElementById("edgeCmsKey").size = metaTag.length;
        document.getElementById("edgeCmsKey").value = metaTag;
        document.getElementById("copyBtn").setAttribute("data-clipboard-text", metaTag);
    }

    function addListeners () {
        var generateKeyBtn = document.getElementById("generateKeyBtn");
        generateKeyBtn.addEventListener("click", generateToken);
    }

    edgeCMS.begin = function () {
        new Clipboard('.btn');
        prepareFirebase();
        addListeners();
    };

    return edgeCMS;
}());