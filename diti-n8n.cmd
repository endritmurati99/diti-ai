@echo off
REM Diti AI - n8nctl wrapper
REM Leitet alle Argumente an n8nctl.cmd mit dem Diti-AI-Projektpfad weiter.
REM Nutzung: diti-n8n --json workflow list
REM          diti-n8n --json workflow local-list --details

n8nctl.cmd --project-root "c:\Users\endri\Desktop\Claude-Projects\Diti AI" --workflow-dir "c:\Users\endri\Desktop\Claude-Projects\Diti AI\n8n\workflows" --env-file "c:\Users\endri\Desktop\Claude-Projects\Diti AI\config\.env" --compose-file "c:\Users\endri\Desktop\Bachelor\Mobile Picking und Voice Assistant\docker-compose.yml" %*
