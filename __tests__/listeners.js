import ListenerGenerator from './../src/listeners';
import helpers from './helpers';

it('has field dependent rule', () => {
    const lg = new ListenerGenerator({ name: 'el'}, '', '', {});
    expect(lg._hasFieldDependency('confirmed:field|required')).toBe('field');
    expect(lg._hasFieldDependency('required|before:field')).toBe('field');
    expect(lg._hasFieldDependency('after:field')).toBe('field');

    // If no field was mentioned, we don't have to search for one
    expect(lg._hasFieldDependency('required|after')).toBe(false);
    expect(lg._hasFieldDependency('required|confirmed')).toBe(false);
    expect(lg._hasFieldDependency('required|before')).toBe(false);

    // custom user declared rules
    expect(lg._hasFieldDependency('required|before_time:10')).toBe(false);
    expect(lg._hasFieldDependency('required|only_after:10')).toBe(false);
});

it('detects input listener events', () => {
    document.body.innerHTML =`<input id="el" type="text" name="field" data-vv-rules="required" data-vv-delay="100">`;
    const el = document.querySelector('#el');

    const valid = [
        ['file', '_fileListener', ['change']],
        ['radio', '_radioListener', ['change']],
        ['checkbox', '_checkboxListener', ['change']],
        ['text', '_inputListener', ['input', 'blur']]
    ];

    valid.forEach(([type, callback, event]) => {
        el.type = type;
        const lg = new ListenerGenerator(el, '', '', {})._getSuitableListener();
        expect(lg.listener.name).toBe(callback);
        expect(lg.names).toEqual(event);
    });
});

it('detects custom listener events', () => {
    const valid = [
        'foo|bar',
        'baz'
    ];

    valid.forEach(event => {
        document.body.innerHTML =`<input id="el" type="text" name="field" data-vv-validate-on="${event}">`;
        const el = document.querySelector('#el');
        const lg = new ListenerGenerator(el, '', '', {})._getSuitableListener();
        expect(lg.names).toEqual(event.split('|'));
    });
});

it('can resolve a field name', () => {
    // using direct field name.
    document.body.innerHTML = `<input id="el" type="text" name="field">`;
    let el = document.querySelector('#el');
    let name = new ListenerGenerator(el, {}, {}, {})._resolveFieldName();
    expect(name).toBe('field');

    // using data attribute.
    document.body.innerHTML = `<input id="el" type="text" data-vv-name="dataName">`;
    el = document.querySelector('#el');
    name = new ListenerGenerator(el, {}, {}, {})._resolveFieldName();
    expect(name).toBe('dataName');

    // using expression.
    name = new ListenerGenerator(el, { expression: 'expressedName' }, '', {})._resolveFieldName();
    expect(name).toBe('expressedName');

    // using component attribute.
    let cgl = new ListenerGenerator(el, { expression: 'expressedName' }, '', {});
    cgl.component = { name: 'componentName' };
    expect(cgl._resolveFieldName()).toBe('componentName');
});

it('can generate a scoped listener', () => {
    document.body.innerHTML = `<input id="el" type="text" name="name" data-vv-scope="scope1">`;
    const el = document.querySelector('#el');
    const scopedCallback = new ListenerGenerator(el, {}, {}, {})._getScopedListener(() => {
        throw 'Oops!'
    });

    // different scope, nope.
    expect(() => {
        scopedCallback('scope2')
    }).not.toThrow('Oops!');

    // no scope, yep.
    expect(() => {
        scopedCallback()
    }).toThrowError('Oops!');

    // same scope, yep.
    expect(() => {
        scopedCallback('scope1')
    }).toThrowError('Oops!');
});