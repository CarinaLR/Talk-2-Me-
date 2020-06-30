import os


from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Global variables
channels_kv = {}
channels_kv['General'] = []
channels_history = []
privateMessage = {}
allUsers = {}
limit = 100


@app.route("/")
def index():
    headline = "User"
    return render_template("index.html", headline=headline)


@app.route("/login", methods=["GET", "POST"])
def login():
   # Set variable to hold username.
    user = request.form.get('user')

    if request.method == "POST":
        return render_template("index.html", headline=user)
    elif not request.form.get("user"):
        return render_template("error.html", message="must be login")


@socketio.on('connect')
def start():
    emit("load channels", {'channels': channels_kv})


@socketio.on('submit to all')
def send_msg(data):
    message = {'text': data['current_msg'],
               'username': data['user'], 'time': data['time']}
    channels_kv['General'].append(message)
    if(len(channels_kv['General']) > limit):
        channels_kv['General'].pop(0)
    emit('announce to all', {'channels': channels_kv}, broadcast=True)


@socketio.on('come back to general')
def restart():
    emit('announce to all', {'channels': channels_kv}, broadcast=True)
