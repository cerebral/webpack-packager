const app = require ('./app');

const PORT = process.env.PORT || 5500;

return app.listen(PORT, () => {
  console.log("Packager started on port " + PORT);
})
