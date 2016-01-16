var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API rppt');
});

//GET /todos?complete=true
app.get('/todos', function(req, res) {
	var query = req.query;
	var where = {};

	if (query.hasOwnProperty('complete') && query.complete === 'true') {
		where.complete = true;
	} else if (query.hasOwnProperty('complete') && query.complete === 'false') {
		where.complete = false;
	}
	if (query.hasOwnProperty('q') && query.q.length > 0) {
		where.description = {
			$like: '%' + query.q + '%'
		};
	}

	db.todo.findAll({where : where}).then (function (todos) {
		res.json(todos);
	}, function (e) {
		res.status(500).send();
	});
	/*
	var filteredTodos = todos;

	if (queryParams.hasOwnProperty('complete') && queryParams.complete === 'true') {
		filteredTodos = _.where(filteredTodos, {complete: true});
	} else if (queryParams.hasOwnProperty('complete') && queryParams.complete === 'false') {
		filteredTodos = _.where(filteredTodos, {complete: false});
	}

	if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
		filteredTodos = _.filter(filteredTodos, function (todo) {
			return todo.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1;
		});
	}

	res.json(filteredTodos);
	*/
});

// GET /todos/:id
app.get('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	db.todo.findById(todoId).then(function (todo) {
		if (!!todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).send();
		}
	}, function (e) {
		res.status(500).send();
	});

	/*
	var matchedTodo = _.findWhere(todos, {id: todoId});
	if (matchedTodo) {
		res.json(matchedTodo);
	} else {
		res.status(404).send();
	}
	*/

});

// POST / todos
app.post('/todos', function(req, res) {
	var body = _.pick(req.body, 'description', 'complete'); //use _.pick to only pick description and complete

	db.todo.create(body).then(function (todo) {
		res.json(todo.toJSON());
	}, function (e) {
		res.status(400).json(e);
	});
	/*
	if (!_.isBoolean(body.complete) || !_.isString(body.description) || body.description.trim().length === 0) {
		return res.status(400).send();
	}

	body.description = body.description.trim();
	//add id field
	body.id = todoNextId++;
	
	// push the body into array
	todos.push(body);

	console.log('description: ' + body.description);
	res.json(body);
	*/
});

// DELETE /todos/:id
app.delete('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.destroy({
		where: {
			id: todoId
		}
	}).then(function (rowsDeleted) {
		if (rowsDeleted === 0) {
			res.status(404).json({
				error: 'No todo with id'
			});
		} else {
			res.status(204).send();
		}
	}, function (e) {
		res.status(500).send();
	});

	/*
	var matchedTodo = _.findWhere(todos, {id: todoId});

	if (!matchedTodo) {
		res.status(404).json({"error" : "no todo found with that id"});
	} else {
		todos = _.without(todos, matchedTodo);
		res.json(matchedTodo);
	}
	*/
});

// PUT /todos/:id
app.put('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	var matchedTodo = _.findWhere(todos, {id: todoId});
	var body = _.pick(req.body, 'description', 'complete'); 
	var validAttributes = {};

	if (!matchedTodo) {
		return res.status(404).send();
	}

	if (body.hasOwnProperty('complete') && _.isBoolean(body.complete)) {
		validAttributes.complete = body.complete;
	} else if (body.hasOwnProperty('complete')) {
		// Bad
		return res.status(400).send();
	}

	if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
		validAttributes.description = body.description;
	} else if (body.hasOwnProperty('description')) {
		return res.status(400).send();
	}

	_.extend(matchedTodo, validAttributes);
	res.json(matchedTodo);
	
});

db.sequelize.sync().then(function () {
	app.listen(PORT, function() {
		console.log('Express listening on PORT ' + PORT + '!');
	});
});



