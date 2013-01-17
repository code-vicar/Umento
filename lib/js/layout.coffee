ns = window.Umento = window.Umento || {}

LoginAPI = ns.require "/js/Login"
username = $("#username").val()
loginDom = $(".login");
login = new LoginAPI.Login username:username
loginView = new LoginAPI.LoginView model:login, el:loginDom.get(0)
