ns = window.Umento = window.Umento || {}

class UmView extends Backbone.View
  assign: (view, selector) ->
    view.setElement(@$(selector)).render()

ns.UmView = UmView
return UmView
