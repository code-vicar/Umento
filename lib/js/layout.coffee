ns = window.Umento = window.Umento || {}
ns.socket = io.connect "#{document.location.host}:#{document.location.port}", 'sync disconnect on unload':true

LoginAPI = ns.require "/js/Login"
username = $("#hdnUsername").val()
#loginDom = $(".login");
login = new LoginAPI.Login username:username
loginView = new LoginAPI.LoginView model:login, el:".login"
