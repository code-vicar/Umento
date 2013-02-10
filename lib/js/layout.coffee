ns = window.Umento = window.Umento || {}

#= require "Login.js"

LoginAPI = ns.LoginAPI

username = $("#hdnUsername").val()

login = new LoginAPI.Login username:username
loginView = new LoginAPI.LoginView model:login, el:".login"