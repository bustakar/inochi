# How to Seed the Database

There are several ways to run the seed mutation to populate the database with muscles and equipment data:

## Option 1: Convex Dashboard (Easiest) ⭐

1. Go to your [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Navigate to the **Functions** tab
4. Find `seed.seedMusclesAndEquipment` in the list
5. Click the **"Run"** button
6. Pass empty args: `{}`
7. Click **"Run Function"**

The mutation will return a success message with counts of inserted records.

## Option 2: Convex CLI

From the root of your project:

```bash
cd packages/backend
npx convex run seed:seedMusclesAndEquipment --args '{}'
```

Or if you're already in the backend directory:

```bash
npx convex run seed:seedMusclesAndEquipment --args '{}'
```

## Option 3: Create a Temporary Admin Page

Create a simple admin page/component that calls the mutation (useful for development):

```tsx
// In your dashboard, create a button that calls:
const seedMutation = useMutation(api.seed.seedMusclesAndEquipment);
await seedMutation({});
```

## Option 4: Run via Convex Dev Console

If you have `convex dev` running:

1. Open the Convex dev dashboard (usually at the URL shown in terminal)
2. Go to Functions tab
3. Run `seed.seedMusclesAndEquipment` with args `{}`

## Verify It Worked

After running the seed, verify the data by:

1. Checking the Convex Dashboard → Data tab
2. Looking for `muscles` and `equipment` tables
3. You should see ~20 muscles and ~24 equipment items

Or in your app, the filters should now show all the muscles and equipment options.

## Notes

- The seed function checks if data already exists and will skip if muscles/equipment are already present
- To re-seed, you'll need to clear the tables first (or modify the seed function to allow force re-seeding)
