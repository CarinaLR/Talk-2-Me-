import os


from flask import Flask, render_template, session, request, redirect
from flask_socketio import SocketIO, send, emit, join_room, leave_room

app = Flask(__name__)
# app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["SECRET_KEY"] = "my chatroom secret"
socketio = SocketIO(app)

# Global variables

# Keep track of channels created (Check for channel name)
channelsCreated = []

# Keep track of users logged (Check for username)
usersLogged = []

# Instanciate a dict
channelsMessages = dict()


@app.route("/")
def index():
    headline = "User"
    return render_template("index.html", headline=headline, channels=channelsCreated)


@app.route("/login", methods=["GET", "POST"])
def login():
    ''' Save the username on a Flask session
    after the user submit the sign in form '''

    # Forget any user
    session.clear()

   # Set variable to hold username.
    user = request.form.get('user')

    if request.method == "POST":
        if len(user) < 1 or user == '':
            return render_template("error.html", message="must enter a username")

        if user in usersLogged:
            return render_template("error.html", message="user already exists!")

        usersLogged.append(user)

        session['user'] = user

        # Remember the user session on a cookie if the browser is closed.
        session.permanent = True

        return redirect("/")
    else:
        return render_template("index.html", headline=user)


@app.route("/logout", methods=['GET'])
def logout():
    """ Logout user from list and delete cookie."""

    # Remove from list
    try:
        usersLogged.remove(session['user'])
    except ValueError:
        pass

    # Delete cookie
    session.clear()

    return redirect("/")


@app.route("/create", methods=['GET', 'POST'])
def create():
    """ Create a channel and redirect to its page """

    # Get channel name from form
    newChannel = request.form.get("channel")

    if request.method == "POST":

        if newChannel in channelsCreated:
            return render_template("error.html", message="channel already exists!")

        # Add channel to global list of channels
        channelsCreated.append(newChannel)

        # Add channel to global dict of channels with messages
        channelsMessages[newChannel] = dict()

        return redirect("/channels/" + newChannel)

    else:

        return render_template("index.html", channels=channelsCreated)


@app.route("/channels/<channel>", methods=['GET', 'POST'])
def enter_channel(channel):
    """ Dispaly channel page to send and receive messages """

    # Updates current channel
    session['current_channel'] = channel

    if request.method == "POST":

        return redirect("/")
    else:
        return render_template("channel.html", channels=channelsCreated, messages=channelsMessages[channel])


@socketio.on("joined", namespace='/')
def joined():
    """ Announce user connected int channel """

    # Save current channel to join room.
    room = session.get('current_channel')

    join_room(room)

    emit('status', {
        'userJoined': session.get('user'),
        'channel': room,
        'msg': session.get('user') + ' has entered the channel'},
        room=room)


@socketio.on("left", namespace='/')
def left():
    """ Announce user has left the channel """

    room = session.get('current_channel')

    leave_room(room)

    emit('status', {
        'msg': session.get('user') + ' has left the channel'},
        room=room)


@socketio.on('send message')
def send_msg(msg, timestamp):
    """ Message with timestamp and broadcast to all """

    # Broadcast only to users on the same channel.
    room = session.get('current_channel')

    # Save 100 messages and pass them when a user joins a specific channel.

    if len(channelsMessages[room]) > 100:
        # Pop the oldest message
        channelsMessages[room].popleft()

    channelsMessages[room].append([timestamp, session.get('username'), msg])

    emit('announce message', {
        'user': session.get('user'),
        'timestamp': timestamp,
        'msg': msg},
        room=room)
