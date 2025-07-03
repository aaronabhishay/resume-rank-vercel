# Migrate n8n to Separate Repository

Since you've already pushed n8n files to your main repo, here's how to cleanly separate them:

## Step 1: Create New Repository

1. **Go to GitHub** and create a new repository:
   - Repository name: `resume-rank-automation` (or `resume-rank-n8n`)
   - Description: "n8n automation workflows for resume-rank application"
   - Set to Public/Private (your choice)
   - ✅ Initialize with README
   - ✅ Add .gitignore (Node)

## Step 2: Clone New Repository

```bash
# Navigate to your projects directory (outside current repo)
cd C:\PROGRAMMING\

# Clone the new repository
git clone https://github.com/yourusername/resume-rank-automation.git
cd resume-rank-automation
```

## Step 3: Copy n8n Files to New Repository

Copy these files from your main repo to the new automation repo:

```bash
# From your main repo directory, copy these files:
cp render.yaml ../resume-rank-automation/
cp N8N_DEPLOYMENT_GUIDE.md ../resume-rank-automation/
cp n8n.env.example ../resume-rank-automation/
cp deploy-n8n.sh ../resume-rank-automation/
cp -r n8n-workflows/ ../resume-rank-automation/
```

## Step 4: Update Files in New Repository

In the new automation repository, update these files:

### Update `N8N_DEPLOYMENT_GUIDE.md`:
- Change references to "this repository" to your new automation repo
- Update GitHub URLs to point to the automation repo

### Update `deploy-n8n.sh`:
- Update the commit message to reflect it's the automation repo
- Update any references to the main repo

### Create new `README.md`:
```markdown
# Resume Rank Automation

n8n workflows and automation for the Resume Rank application.

## Quick Deploy to Render

1. Click "New" → "Blueprint" in Render Dashboard
2. Connect this repository
3. Deploy with name: `resume-rank-automation`

## Documentation

See [N8N_DEPLOYMENT_GUIDE.md](./N8N_DEPLOYMENT_GUIDE.md) for complete setup instructions.

## Main Application

The main Resume Rank application is at: [your-main-repo-url]
```

## Step 5: Commit and Push New Repository

```bash
cd resume-rank-automation
git add .
git commit -m "Initial setup: n8n automation for resume-rank

- Add Render Blueprint configuration
- Add deployment guide and workflows
- Add sample automation workflows
- Ready for Render deployment"

git push origin main
```

## Step 6: Clean Up Main Repository

Back in your main resume-rank repository:

```bash
cd C:\PROGRAMMING\resume-rank\ -\ Copy\ 2

# Remove n8n files
git rm render.yaml
git rm N8N_DEPLOYMENT_GUIDE.md
git rm n8n.env.example
git rm deploy-n8n.sh
git rm -r n8n-workflows/

# Clean up .gitignore (remove n8n-specific entries)
# Edit .gitignore and remove these lines:
# # n8n specific files
# .env.n8n
# .env.n8n.local
# n8n-data/
# *.n8n.backup
# n8n-workflows/*.backup

# Commit the cleanup
git add .
git commit -m "Move n8n automation to separate repository

n8n automation moved to: https://github.com/yourusername/resume-rank-automation
This keeps the main application focused and automation separate."

git push origin main
```

## Step 7: Update Documentation

In your main repository, optionally add a note in your README.md:

```markdown
## Related Projects

- **Automation**: [resume-rank-automation](https://github.com/yourusername/resume-rank-automation) - n8n workflows for automated processes
```

## Step 8: Deploy from New Repository

1. Go to Render Dashboard
2. Create new Blueprint pointing to your `resume-rank-automation` repository
3. Deploy as normal

## Benefits of This Separation

✅ **Clean main repository** - Focused only on the core application  
✅ **Independent deployments** - Update automations without touching main app  
✅ **Better organization** - Clear separation of concerns  
✅ **Team collaboration** - Different access levels for automation vs app development  
✅ **Reusability** - Automation repo can be forked/reused for other projects  

## File Structure After Migration

```
resume-rank/                     # Main app repository
├── src/
├── api/
├── package.json
└── README.md

resume-rank-automation/          # New automation repository  
├── render.yaml
├── N8N_DEPLOYMENT_GUIDE.md
├── n8n-workflows/
├── n8n.env.example
├── deploy-n8n.sh
└── README.md
```

That's it! You now have a clean separation between your main application and automation workflows. 