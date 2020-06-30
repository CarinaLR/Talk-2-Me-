//function to prompt user name

function hello() {
  let user = prompt("Hello, please enter your name", "username");
  if (user !== null) {
    document.getElementById("user").innerHTML = user;
  }
}

//function to start the active chatroom.
$(function () {
  //Set variables to use in chat.
  let socket = io.connet(
    location.protocol + "//" + document.domain + ":" + location.port
  );
  privateWindow = false;
  inRoom = false;
  //When chat is active
  socket.on("connect", () => {
    $("#input_msg").on("keyup", function (key) {
      active_channel = $("#channels_history .active").attr("id");
      //Broadcast to all
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
      //Send to channel
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
        //Send to private channel
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
    //Start list of channels
    $("#channels_history").on("click", "li", function () {
      $("#input_msg").focus();
      if (!localStorage.getItem("active_channel")) {
        active_channel = "General";
      } else {
        active_channel = localStorage.getItem("active_channel");
      }
      //Set variables
      const user = localStorage.getItem("user");
      const time = new Date().toLocaleString();

      $(this).addClass("active");
      $(this).siblings().removeClass("active");
      $("#messages").html("");
      //Announce that user has leave the room
      if (active_channel !== "General" && !privateWindow) {
        socket.emit("leave", {
          channel: active_channel,
          current_msg: "user disconnected",
          user: user,
          time: time,
        });
      }

      active_channel = $("#channels_history .active").attr("id");
      localStorage.setItem("active_channel", active_channel);
      //Announce that come back to general channel
      if (active_channel === "General") {
        inRoom = false;
        privateWindow = false;
        return socket.emit("general channel");
      } else {
        inRoom = true;
        privateWindow = false;
      }
      socket.emit("join", {
        channel: active_channel,
        current_msg: "initiate room",
        user: user,
        time: time,
      });
    });
    //Prevent the user to close modal.
    if (!localStorage.getItem("user")) {
      $("#myModay").modal({ backdrop: "static", keyboard: false });
      $(".modal-title").text("Please enter your username");
      $("#modalInput").val("");
    }
  });
  //If the room is not private, all can read message
  socket.on("announce to all", (data) => {
    if (!privateWindow) {
      loadMessages(data);
    }

    $(".text-danger").on("click", () => {
      chooseUser($(this).text());
    });
  });
  //Join function
  socket.on("joined", (data) => {
    loadMessages(data);

    $("#input_msg").foucs();
    $(".text-danger").on("click", () => {
      chooseUser($(this).text());
    });
  });
  //Left function
  socket.on("left", (data) => {
    loadMessages(data);
  });
  //Send user to a room
  socket.on("announce to room", (data) => {
    loadMessages(data);
    $(".text-danger").on("click", () => {
      chooseUser($(this).text());
    });
  });
  //Add user and prevent user to close modal.
  socket.on("add user", (data) => {
    if (data["error"] !== "") {
      window.setTimeout(() => {
        $("#myModay").modal({ backdrop: "static", keyboard: flase });
        $(".modal-title").text(data["error"]);
        $("#modalInput").val("");
        $("#modalButton").attr("disabled", true);
      }, 900);
    } else {
      localStorage.setItem("user", data["user"]);
      $("$user").text(localStorage.getItem("user"));
      $("#General").clicl();
      $("$input_msg").focus();
    }
  });
  //Add channel
  socket.on("add channel", (data) => {
    if (data["error"] !== "") {
      window.setTimeout(() => {
        $("#myModal").modal({ backdrop: "static", keyboard: false });
        $(".modal-title").text(data["error"]);
        $("#modalInput").val("");
        $("#modalButton").attr("disabled", true);
      }, 900);
    } else {
      appendChannel(data["channel"]);
      $("#channels_history li:last").addClass("active");
      $("#channels_history li:last").click();
      inRoom = true;

      let removeHash = $("#channels_history li:last").text().slice(1);
      localStorage.setItem("active_channel", removeHash);
      $("#channels_history").scrollTop(500000);
      $("$input_msg").focus();
      socket.emit("last updates", { channel: data["channel"] });
    }
  });
});
