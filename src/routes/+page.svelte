<script>
	import { onMount } from "svelte";
	import store from "../store/socket.js"
	let db = {};
	let value = '';
	const sessions = [
		{
			id: '1ffasd',
			name: 'Max Pull',
			type: 'S/C'
		},
		{
			id: '234dfsfs',
			name: '1 on 1 off',
			type: 'base'
		}
	];

	let messages = []
	let message 
	
	function addMessageToDB(message) {
		console.log(message, "message")
		console.log(db, "db")

		if(db.transaction) {
			console.log("transacting")
			const obs = db.transaction(['sessions'], 'readwrite').objectStore('sessions')
	
			const result = obs.add(JSON.parse(message))

			result.onsuccess = (event) => { console.log("added", event) }
		}

	}

	onMount(() => {
		store.subscribe(currMessage => {
			messages = [...messages, currMessage];
			addMessageToDB(currMessage)
		})
	})

	function getSessionInIndexedDB(val) {
		return new Promise((resolve, reject) => {
			try {
				if (typeof db != undefined && value.length) {
					const obs = db.transaction('sessions').objectStore('sessions');
					const index = obs.index('name');
					let res = [];

					index.openCursor().onsuccess = (event) => {
						const cursor = event.target.result;

						if (cursor) {
							if (cursor.key.includes(val)) {
								res.push(cursor.value);
							}
							cursor.continue();
						} else {
							resolve(res);
						}
					};
				}
			} catch (err) {
				console.log(err, 'error');
				reject([]);
			}
		});
	}
	const request = window.indexedDB.open('TestDB', 3);

	request.onerror = (event) => {
		console.error('error in indexedDb connnection', event.target.errorCode);
	};

	request.onsuccess = (event) => {
		console.log('sussess ', event);
		db = event.target.result;
	};

	function createSessionStore(db) {
		const objectStore = db.createObjectStore('sessions', { keyPath: 'id' });

		objectStore.createIndex('name', 'name', { unique: false });
		objectStore.createIndex('type', 'type', { unique: false });

		objectStore.transaction.oncomplete = (event) => {
			const sessionObjectStore = db.transaction('sessions', 'readwrite').objectStore('sessions');

			sessions.forEach((session) => {
				sessionObjectStore.add(session);
			});
		};
	}
	request.onupgradeneeded = (event) => {
		const db = event.target.result;

		console.log('db', db);
		if (!db.objectStoreNames.contains('sessions')) createSessionStore(db);
	};

	function handleClick(event) {
		console.log(' do we have a db?', db);
		console.log('clicked');
		let session = {};
		const formData = new FormData(event.target);
		const transaction = db.transaction(['sessions'], 'readwrite');
		for (const pair of formData.entries()) {
			console.log(pair[0], pair[1]);
			session.id = new Date().getTime();
			session[pair[0]] = pair[1];
		}

		const objStore = transaction.objectStore('sessions');

		const response = objStore.add(session);
		response.onsuccess = (ev) => {
			store.sendMessage(JSON.stringify(session));
			console.log(ev, 'ev');
		}
	}

	let items = [];
	$: getSessionInIndexedDB(value).then((item) => (items = item));
</script>

<form on:submit={handleClick}>
	<label>
		<span> Workout Name </span>
		<input type="text" name="name" id="name" />
	</label>

	<label>
		<span> workout category </span>
		<select name="type" id="type">
			<option value="S/C"> Strength and Conditioning </option>
			<option value="Base"> Base </option>
		</select>
	</label>

	<button type="submit"> Create Workout </button>
</form>

<div>
	<label>
		<span> What do you want to look for? </span>
		<input
			type="text"
			bind:value
			on:input={() => console.log('value', value)}
			name="sessionName"
			id="sessionName"
		/>
	</label>

	{#if items.length && value.length}
		<p>Search Result</p>
		{#each items as item}
			<li>{item.name}</li>
		{/each}
	{:else}
		<p>No search results</p>
	{/if}
</div>
