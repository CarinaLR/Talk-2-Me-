//function to prompt user name

function hello() {
  let user = prompt("Hello, please enter your name", "username");
  if (user !== null) {
    document.getElementById("user").innerHTML = user;
  }
}

$(function () {
  let socket = io.connet(
    location.protocol + "//" + document.domain + ":" + location.port
  );
  privateWindow = false;
  inRoom = false;

  socket.on("connect", () => {
    $("#input_msg").on("keyup", function (key) {
      active_channel = $("#channels_history .active").attr("id");

      if (
        key.keyCode === 13 &&
        $(this).val() !== "" &&
        !privateWindow &&
        !inRoom
      ) {
        const current_msg = $(this).val();
        const user = localStorage.getItem("user");
        const time = new Date().toLocaleString();

        $("#input_msg").val("");
        socket.emit("submit to all", {
          current_msg: current_msg,
          user: user,
          time: time,
        });
      }

      if (
        key.keyCode === 13 &&
        $(this).val() !== "" &&
        !privateWindow &&
        inRoom
      ) {
        const current_msg = $(this).val();
        const user = localStorage.getItem("user");
        const time = new Date().toLocaleString();

        $("#input_msg").val("");
        socket.emit("submit to room", {
          channel_kv: active_channel,
          current_msg: current_msg,
          user: user,
          time: time,
        });
      } else if (
        key.keyCode === 13 &&
        $(this).val !== "" &&
        privateWindow &&
        !inRoom
      ) {
        const current_msg = $(this).val();
        const user = localStorage.getItem("user");
        const other_user = localStorage.getItem("active_msg");
        const time = new Date().toLocaleString();

        $("input_msg").val("");
        socket.emit("private", {
          current_msg: current_msg,
          user: user,
          other_user: other_user,
          time: time,
        });
      }
    });
  });
});
