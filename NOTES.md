# Leave below any info you want examiners to see

Including the info on the starter code (whose repository and how used), notes on seeding and launching the app, optional info on the work distribution within the team, and notes on unfinished parts of the project and unpatched bugs.

## Source code
The backend is sourced from Iselin's oblig 2
The web-components are sourced from Ben's oblig 1
The styling is sourced from Ben's oblig 3
We took inpiration from bens oblig 3 but most of the frontend is built from scratch. Profilepage has some source code from iselin's oblig 3

## Launching the app
To launch the app redirect to the folders and type in these comands.

Frontend: 
```bash
cd ./frontend
npm install
npm run dev
```

Backend:
```bash
cd ./backend
npm install
npm run seed # make sure mongoDB compass is running
npm run dev
```

## unifnished part
On the admin pages there is no pagination. 
Tournament winner bonus points is not implemented yet. the player only receives what is in the pot upon winning a tournament. 
