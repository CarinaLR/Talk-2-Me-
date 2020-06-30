import os


from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)


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
