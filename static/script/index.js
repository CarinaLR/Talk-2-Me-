//function to alert user name

function hello() {
  let user = prompt("Hello, please enter your name", "username");
  if (user !== null) {
    document.getElementById("user").innerHTML = user;
  }
}
