// Create the artifact
const CBSC = artifacts.require("CBSC");

contract("CBSC Simulation", async (accounts) => {
  require("dotenv").config();
  const fs = require("fs");
  const sb = require("@supabase/supabase-js");
  const formatXml = require("xml-formatter");
  const xmlParser = require("xml2json");
  const supabase = sb.createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  let x = accounts[1];
  let y = accounts[2];
  let xz = accounts[3];
  let yz = accounts[4];
  let debtor = x; //xz
  let creditor = y; //yz

  /*
   * Instance to connect to smart contract via Ganache-CLI
   * */
  let instance;
  let hash;
  let balance;
  let state;

  async function queryEventData() {
    let { data: events, error } = await supabase.from("events").select("id");
    return events;
  }

  async function getActionCounter() {
    let { data: actions, error } = await supabase.from("actions").select(`
                    id
                `);
    return actions[0].id;
  }

  async function queryActionData(_action_counter) {
    let { data: action, error } = await supabase
      .from("actions")
      .select(
        `
                    fulfillment_value,
                    message,
                    transition,
                    operation,
                    events (
                        id, title
                    ),
                    commitments (
                        id, title, state, debtor, creditor, fluents (
                        id, title, atomic, balance, max_terms, terms_left, original_balance, start, end
                    )
                    )
                `
      )
      .eq("id", _action_counter);
    return action[0];
  }

  async function writeCommitRuleMLOutput(time, json) {
    /*
     * Write transaction hash back protocol run and store it in bc-output.xml
     * */
    fs.writeFile(
      "test/commitruleml/run/run-" + time + ".commitruleml",
      formatXml(xmlParser.toXml(json), {
        collapseContent: false,
      }),
      function (err, result) {
        if (err) {
          console.log("Unable to write RuleML file");
        } else {
          console.log();
          console.log(
            "  CommitRuleML template file run-" +
            time +
            ".commitruleml generated"
          );
          console.log();
        }
      }
    );
  }

  async function createCommitRuleMLFile(_action, _time) {
    let ruleMLTemplate = fs.readFileSync(
      "test/commitruleml/template/template.commitruleml",
      "utf8"
    );
    templateJson = xmlParser.toJson(ruleMLTemplate, {
      reversible: true,
      object: true,
    });

    //on template attributes matching
    templateJson.Rule.Assert.on.Happens.Event.id = _action.events.id;
    templateJson.Rule.Assert.on.Happens.Event.id = _action.events.title;
    //templateJson.Rule.Assert.on.Happens.Event.slot.title = ;
    //templateJson.Rule.Assert.on.Happens.Event.slot.ind.value = ;
    templateJson.Rule.Assert.on.Happens.Time.value = _time;

    let start = _action.commitments.fluents[0].start.split(".");
    let end = _action.commitments.fluents[0].end.split(".");

    //if template attributes matching
    templateJson.Rule.Assert.if.HoldsAt.Commitment.id = _action.commitments.id;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.type =
      _action.commitments.type;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.title =
      _action.commitments.title;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.role =
      _action.commitments.role;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.state =
      _action.commitments.state;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Agent.address = x;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Agent.type =
      _action.commitments.debtor;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Agent.address = y;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Agent.type = y;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Fluent.id =
      _action.commitments.fluents[0].id;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Fluent.type =
      _action.commitments.fluents[0].type;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Fluent.title =
      _action.commitments.fluents[0].title;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Fluent.value =
      _action.commitments.fluents[0].title;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Fluent.balance =
      _action.commitments.fluents[0].balance;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Fluent.original_balance =
      _action.commitments.fluents[0].original_balance;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Fluent,
      (atomic = _action.commitments.fluents[0].atomic);
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Fluent.terms =
      _action.commitments.fluents[0].terms;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Fluent.terms_left =
      _action.commitments.fluents[0].terms_left;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Fluent.Start.event =
      _action.commitments.fluents[0].start.event;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Fluent.Start.action =
      _action.commitments.fluents[0].start.action;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Fluent.Start.iteration =
      _action.commitments.fluents[0].start.iteration;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Fluent.End.event =
      _action.commitments.fluents[0].end.event;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Fluent.End.action =
      _action.commitments.fluents[0].end.action;
    templateJson.Rule.Assert.if.HoldsAt.Commitment.Fluent.End.iteration =
      _action.commitments.fluents[0].end.iteration;
    templateJson.Rule.Assert.if.Action.id = _action.id;
    templateJson.Rule.Assert.if.Action.operation = _action.operation;
    templateJson.Rule.Assert.if.Action.transition = _action.transition;
    templateJson.Rule.Assert.if.Action.message = _action.message;
    templateJson.Rule.Assert.if.Action.Commitment.id = _action.commitments.id;
    templateJson.Rule.Assert.if.Action.Commitment.type =
      _action.commitments.type;
    templateJson.Rule.Assert.if.Action.Commitment.title =
      _action.commitments.title;
    templateJson.Rule.Assert.if.Action.Commitment.role =
      _action.commitments.role;
    templateJson.Rule.Assert.if.Action.Commitment.state =
      _action.commitments.state;
    templateJson.Rule.Assert.if.Action.Commitment.Agent.address = x;
    templateJson.Rule.Assert.if.Action.Commitment.Agent.type =
      _action.commitments.debtor;
    templateJson.Rule.Assert.if.Action.Commitment.Agent.address = y;
    templateJson.Rule.Assert.if.Action.Commitment.Agent.type =
      _action.commitments.creditor;
    templateJson.Rule.Assert.if.Action.Commitment.Fluent.id =
      _action.commitments.fluents[0].id;
    templateJson.Rule.Assert.if.Action.Commitment.Fluent.type =
      _action.commitments.fluents[0].type;
    templateJson.Rule.Assert.if.Action.Commitment.Fluent.title =
      _action.commitments.fluents[0].title;
    templateJson.Rule.Assert.if.Action.Commitment.Fluent.value =
      _action.commitments.fluents[0].value;
    templateJson.Rule.Assert.if.Action.Commitment.Fluent.balance =
      _action.commitments.fluents[0].balance;
    templateJson.Rule.Assert.if.Action.Commitment.Fluent.original_balance =
      _action.commitments.fluents[0].original_balance;
    templateJson.Rule.Assert.if.Action.Commitment.Fluent.atomic =
      _action.commitments.fluents[0].atomic;
    templateJson.Rule.Assert.if.Action.Commitment.Fluent.terms =
      _action.commitments.fluents[0].terms;
    templateJson.Rule.Assert.if.Action.Commitment.Fluent.terms_left =
      _action.commitments.fluents[0].terms_left;
    templateJson.Rule.Assert.if.Action.Commitment.Fluent.Start.event = start[0];
    templateJson.Rule.Assert.if.Action.Commitment.Fluent.Start.action =
      start[1];
    templateJson.Rule.Assert.if.Action.Commitment.Fluent.Start.iteration =
      start[2];
    templateJson.Rule.Assert.if.Action.Commitment.Fluent.End.event = end[0];
    templateJson.Rule.Assert.if.Action.Commitment.Fluent.End.action = end[1];
    templateJson.Rule.Assert.if.Action.Commitment.Fluent.End.iteration = end[2];

    //on template attributes matching
    templateJson.Rule.Assert.do.Action.id = _action.id;
    templateJson.Rule.Assert.do.Action.operation = _action.operation;
    templateJson.Rule.Assert.do.Action.transition = _action.transition;
    templateJson.Rule.Assert.do.Action.message = _action.message;
    templateJson.Rule.Assert.do.Action.Commitment.id = _action.commitments.id;
    templateJson.Rule.Assert.do.Action.Commitment.type =
      _action.commitments.type;
    templateJson.Rule.Assert.do.Action.Commitment.title =
      _action.commitments.title;
    templateJson.Rule.Assert.do.Action.Commitment.role =
      _action.commitments.role;
    templateJson.Rule.Assert.do.Action.Commitment.state =
      _action.commitments.state;
    templateJson.Rule.Assert.do.Action.Commitment.Agent.address =
      _action.commitments.debtor;
    templateJson.Rule.Assert.do.Action.Commitment.Agent.type = x;
    templateJson.Rule.Assert.do.Action.Commitment.Agent.address =
      _action.commitments.creditor;
    templateJson.Rule.Assert.do.Action.Commitment.Agent.type = y;
    templateJson.Rule.Assert.do.Action.Commitment.Fluent.id =
      _action.commitments.fluents[0].id;
    templateJson.Rule.Assert.do.Action.Commitment.Fluent.type =
      _action.commitments.fluents[0].type;
    templateJson.Rule.Assert.do.Action.Commitment.Fluent.title =
      _action.commitments.fluents[0].title;
    templateJson.Rule.Assert.do.Action.Commitment.Fluent.value =
      _action.commitments.fluents[0].value;
    templateJson.Rule.Assert.do.Action.Commitment.Fluent.balance =
      _action.commitments.fluents[0].balance;
    templateJson.Rule.Assert.do.Action.Commitment.Fluent.original_balance =
      _action.commitments.fluents[0].original_balance;
    templateJson.Rule.Assert.do.Action.Commitment.Fluent.atomic =
      _action.commitments.fluents[0].atomic;
    templateJson.Rule.Assert.do.Action.Commitment.Fluent.terms =
      _action.commitments.fluents[0].terms;
    templateJson.Rule.Assert.do.Action.Commitment.Fluent.terms_left =
      _action.commitments.fluents[0].terms_left;
    templateJson.Rule.Assert.do.Action.Commitment.Fluent.Start.event = start[0];
    templateJson.Rule.Assert.do.Action.Commitment.Fluent.Start.action =
      start[1];
    templateJson.Rule.Assert.do.Action.Commitment.Fluent.Start.iteration =
      start[2];
    templateJson.Rule.Assert.do.Action.Commitment.Fluent.End.event = end[0];
    templateJson.Rule.Assert.do.Action.Commitment.Fluent.End.action = end[1];
    templateJson.Rule.Assert.do.Action.Commitment.Fluent.End.iteration = end[2];

    await writeCommitRuleMLOutput(_time, templateJson);
  }

  async function removeAllCommitRuleMlFiles() {
    fs.readdir("test/commitruleml/run/", (err, files) => {
      if (err) console.log(err);
      for (const file of files) {
        fs.unlinkSync("test/commitruleml/run/" + file);
      }
    });
  }

  async function commit(_actionNumber, _debtor, _creditor, _time) {
    // step 1: read the actions from the CBSC.app
    let _action = await queryActionData(_actionNumber);

    // step 2: create the CommitRuleMl file from the template
    await createCommitRuleMLFile(_action, _time);

    // step 3:
    await instance.commit(
      _action.commitments.id,
      _action.operation,
      _debtor,
      _creditor,
      _action.commitments.fluents[0].id,
      _action.commitments.fluents[0].balance,
      _action.commitments.fluents[0].atomic,
      _action.commitments.fluents[0].start,
      _action.commitments.fluents[0].end
    );

    templateJson.Rule.signature = hash;
    assert.equal(_action.transition, state, "Saving commit state failed");
    assert.equal(templateJson.Rule.signature, hash, "Saving signature failed");
  }

  async function activate(_actionNumber, _debtor, _creditor, _time, _log) {
    // step 1: read the actions from the CBSC.app
    let _action = await queryActionData(_actionNumber);

    // step 2: create the CommitRuleMl file from the template
    await createCommitRuleMLFile(_action, _time);

    // step 3:
    await instance.activate(
      _action.commitments.id,
      _action.operation,
      _debtor,
      _creditor,
      _action.commitments.fluents[0].id,
      _action.commitments.fluents[0].balance,
      _action.commitments.fluents[0].atomic,
      _action.commitments.fluents[0].start,
      _action.commitments.fluents[0].end
    );

    if (_log == 1) {
      templateJson.Rule.signature = hash;
      assert.equal(_action.transition, state, "Saving activate state failed");
      assert.equal(
        templateJson.Rule.signature,
        hash,
        "Saving signature failed"
      );
    }
  }

  async function satisfy(_actionNumber, _time) {
    // step 1: read the actions from the CBSC.app
    let _action = await queryActionData(_actionNumber);

    // step 2: create the CommitRuleMl file from the template
    await createCommitRuleMLFile(_action, _time);

    // step 3:
    await instance.satisfy(
      _action.commitments.fluents[0].id,
      _action.commitments.id,
      _action.operation,
      _time
    );

    templateJson.Rule.signature = hash;
    assert.equal(_action.transition, state, "Saving satisfy state failed");
    assert.equal(templateJson.Rule.signature, hash, "Saving signature failed");
  }

  async function partialSatisfy(_actionNumber, _time) {
    // step 1: read the actions from the CBSC.app
    let _action = await queryActionData(_actionNumber);

    // step 2: create the CommitRuleMl file from the template
    await createCommitRuleMLFile(_action, _time);

    // step 3:
    await instance.partialSatisfy(
      _action.commitments.fluents[0].id,
      _action.commitments.id,
      _action.fulfillment_value - 2,
      _action.operation,
      _time
    );

    templateJson.Rule.signature = hash;
    assert.equal("activate", state, "Saving (partial) satisfy state failed");
    assert.equal(templateJson.Rule.signature, hash, "Saving signature failed");
  }

  async function cancel(_actionNumber, _debtor, _time) {
    // step 1: read the actions from the CBSC.app
    let _action = await queryActionData(_actionNumber);

    // step 2: create the CommitRuleMl file from the template
    await createCommitRuleMLFile(_action, _time);

    // step 3:
    await instance.cancel(_debtor, _action.commitments.id, _action.operation);

    templateJson.Rule.signature = hash;
    assert.equal(_action.transition, state, "Saving cancel state failed");
    assert.equal(templateJson.Rule.signature, hash, "Saving signature failed");
  }

  async function release(_actionNumber, _creditor, _time) {
    // step 1: read the actions from the CBSC.app
    let _action = await queryActionData(_actionNumber);

    // step 2: create the CommitRuleMl file from the template
    await createCommitRuleMLFile(_action, _time);

    // step 3:
    await instance.release(
      _creditor,
      _action.commitments.id,
      _action.operation
    );

    templateJson.Rule.signature = hash;
    assert.equal(_action.transition, state, "Saving release state failed");
    assert.equal(templateJson.Rule.signature, hash, "Saving signature failed");
  }

  before("Preparing CBSC", async () => {
    instance = await CBSC.deployed();

    /*
     * Setup roles for test, defaults to x & y
     * Optional functions to delegate or assign
     */
    await instance.setupRoles(debtor, creditor);
    //await instance.grantDebtorRole(xz);
    //await instance.grantCreditorRole(yz);

    instance.StateLog({}, async (error, result) => {
      if (error) {
        console.log(error);
      }
      if (result) {
        hash = result.transactionHash;
        state = result.args.state;
        console.log("  Signature is: " + result.transactionHash);
        console.log("  State is: " + result.args.state);

        console.log();
      }
    });
  });

  /*
 * Define which test is ran for the simulation. Each test confirms to equally named EC rules
 */
  let _test = 7;

  if (_test == 1) {
    it("Test 1: Commit a commitment", async () => {
      await removeAllCommitRuleMlFiles();
      await commit(8, debtor, creditor, 110);
    });
  }

  if (_test == 2) {
    it("Test 2: Activate a commitment", async () => {
      await removeAllCommitRuleMlFiles();
      await activate(9, debtor, creditor, 110);
    });
  }

  if (_test == 3) {
    it("Test 3: Satisfy a commitment", async () => {
      await removeAllCommitRuleMlFiles();
      await activate(9, debtor, creditor, 110, 0);
      //await satisfy(10, 120);
      await partialSatisfy(10, 120);
    });
  }

  if (_test == 4) {
    it("Test 4: Process a conditional commitment that resolves to commit", async () => {
      await removeAllCommitRuleMlFiles();
      await commit(8, debtor, creditor, 110);
      await activate(9, debtor, creditor, 120, 0);
      await satisfy(10, 130);
      await commit(11, debtor, creditor, 140);
    });
  }

  if (_test == 5) {
    it("Test 5: Process a conditional commitment that resolves to activate", async () => {
      await removeAllCommitRuleMlFiles();
      await activate(9, debtor, creditor, 110, 0);
      await satisfy(10, 120);
      await activate(12, debtor, creditor, 130, 1);
    });
  }

  if (_test == 6) {
    it("Test 6: Delegate a commitment", async () => {
      await removeAllCommitRuleMlFiles();
      await commit(8, debtor, creditor, 110);
      //await activate(9, debtor, creditor, 110, 0);
      await cancel(13, creditor, 120);
      await instance.revokeDebtorRole(debtor);
      await instance.grantDebtorRole(xz);
      await commit(11, xz, creditor, 130);
    });
  }

  if (_test == 7) {
    it("Test 7: Assign a commitment", async () => {
      await removeAllCommitRuleMlFiles();
      //await commit(8, debtor, creditor, 110);
      await activate(9, debtor, creditor, 110, 1);
      await release(14, creditor, 120);
      await instance.revokeCreditorRole(creditor);
      await instance.grantCreditorRole(yz);
      await commit(11, debtor, yz, 130);
    });
  }
});
