exports.loginView = function(req, res) {
  res.render("admin-login", {
    title: "Admin Login | LWCMP Tool"
  });
};

exports.loginVerify = function(req, res) {

};

exports.view = function(req, res) {
  res.render("admin", {
    title: "Admin Dashboard | LWCMP Tool"
  });
};
