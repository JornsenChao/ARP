let's change the "step" page (when use click a step) first.
After the user choose the specific step, I want the entire page to display only 1 "start" button  and "detail". 
the "detail" is actually not a button, so it is not clickable. but for user's mouse to hover on and a window containing the steps's detail info will be displayed in the window. 

for tasks under the step, each have a state "finished/current/upcoming". the can be multiple finished or upcoming, but there will only be one "current" task. if the user has not do anything yet, then the "current" would be the first task under this step. 

now go back to "start" button in the step page, this button will contains text about the "current" task's name. So when the user click the start, user will be directed to a more detailed page about the "current" step. when user execute and done, he should mark this as "finished" and click "next step". 

when the user is in the task page, the "current" task is the only active task. But all the several tasks under the steps will be displayed in a linear way, with "finished tasks" (or checkpoint) greyed out, and "current task" still in more visible color, and "upcoming task" in another color.  Please note that the "current task" is displayed in the step page.

please make sure that I am providing an functional chagne, and also make the UI easier for user.
The code you provide must be: real, completed, runable, not just demo.

"""
"""

```
the entire user journey in the workflow shoul dbe like this:
0. User click the workflow in the top bar to go to workflow page "http://localhost:3000/workflow". he can see the entire 7 steps. User can pick a step

1. after the user click on a step, say step 1 "http://localhost:3000/workflow/step/1", use could see an a light grey "Expected Deliverable" text, and when user's mouse hover on this text, use can see a window showing some details and also the expected deliverable of this step.

2. still in  step 1 "http://localhost:3000/workflow/step/1", user can see a button "start xxxxxtask", this task is the "current" task of this step, and also the only "active" task. (Background: for tasks under the step, each have a state "finished/current/upcoming". the can be multiple finished or upcoming, but there will only be one "current" task. if the user has not do anything yet, then the "current" would be the first task under this step. ) User will can click the "start xxxxxtask" button to go to this task.

3. user now has alraday click the "start xxxxxtask" button and go to see all the task listed below (the ui is using like connecting them all together), with all the finished tasks grey out, the current task have the most visible color, and the upcoming tasks have another color. All these task have "view" button (if click, will bring the user to task page, like this http://localhost:3000/workflow/step/1/task/101"), but only the current task has a "start" button. Right now user is still in this "http://localhost:3000/workflow/step/1"

4. if user click the  "start" button of the only active and only current task, user will go to task page, execeute the task. in this page user can see a "mark as complete" button, and when click, use then can still see the "prev task" and "next task", click on either will leave the current task
```
